"""Authenticated liveness and employee identity API."""

import base64
import binascii
from contextlib import asynccontextmanager
import hashlib
import hmac
from io import BytesIO
import logging
import math
import os
from pathlib import Path
import threading

import cv2
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
import numpy as np
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

from src.detection import load_detector, detect
from src.inference import load_model, infer, crop, process_with_logits
from identity import IdentityEngine

ROOT = Path(__file__).resolve().parent
MAX_IMAGE_BYTES = 2_000_000
MAX_PIXELS = 12_000_000


class ImageRequest(BaseModel):
    image: str = Field(min_length=1, max_length=2_800_000)


class EnrollmentRequest(ImageRequest):
    employeeId: int = Field(gt=0, strict=True)


class BodyLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > 2_900_000:
                response = JSONResponse({"detail": "Request exceeds image limit"}, status_code=413)
                return await response(scope, receive, send)
            if not message.get("more_body", False):
                break

        async def bounded_receive():
            return {"type": "http.request", "body": bytes(body), "more_body": False}

        await self.app(scope, bounded_receive, send)


def decode_image(value: str) -> np.ndarray:
    prefix = "data:image/jpeg;base64,"
    if not value.startswith(prefix):
        raise HTTPException(400, "A JPEG data URL is required")
    try:
        data = base64.b64decode(value[len(prefix):], validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(400, "Invalid image encoding") from None
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Image exceeds 2 MB")
    try:
        with Image.open(BytesIO(data)) as image:
            if image.format != "JPEG":
                raise HTTPException(400, "Only JPEG images are accepted")
            if image.width * image.height > MAX_PIXELS:
                raise HTTPException(413, "Image dimensions are too large")
            image.load()
            return np.asarray(image.convert("RGB"))
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(400, "Invalid JPEG image") from None


class LivenessEngine:
    def __init__(self):
        detector_path = Path(os.getenv("DETECTOR_MODEL", ROOT / "models/detector_quantized.onnx"))
        model_path = Path(os.getenv("LIVENESS_MODEL", ROOT / "models/best_model_quantized.onnx"))
        self.detector = load_detector(str(detector_path), (320, 320))
        self.session, self.input_name = load_model(str(model_path))
        if self.detector is None or self.session is None:
            raise RuntimeError("Unable to load detector/liveness ONNX models")
        shape = self.session.get_inputs()[0].shape
        if len(shape) != 4 or shape[1] != 3 or not isinstance(shape[2], int) or shape[2] != shape[3]:
            raise RuntimeError("Expected a square NCHW RGB liveness model")
        self.image_size = shape[2]
        probability = float(os.getenv("LIVENESS_THRESHOLD", "0.5"))
        if not math.isfinite(probability) or not 0 < probability < 1:
            raise RuntimeError("LIVENESS_THRESHOLD must be between 0 and 1")
        self.threshold = math.log(probability / (1 - probability))
        self.version = "liveness-" + hashlib.sha256(model_path.read_bytes()).hexdigest()[:16]
        # FaceDetectorYN has mutable input-size state; serialize detection/inference.
        self.lock = threading.Lock()

    def check(self, rgb: np.ndarray) -> dict:
        with self.lock:
            # YuNet expects OpenCV BGR; the liveness model uses the demo's RGB preprocessing.
            faces = detect(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), self.detector)
            if len(faces) != 1:
                raise HTTPException(422, "Show exactly one clear face, away from image edges")
            box = faces[0]["bbox"]
            x, y, w, h = (box[k] for k in ("x", "y", "width", "height"))
            image = crop(rgb, (x, y, x + w, y + h), 1.5)
            predictions = infer([image], self.session, self.input_name, self.image_size)
            if len(predictions) != 1 or not np.isfinite(predictions[0]).all():
                raise HTTPException(503, "Liveness inference failed")
            result = process_with_logits(predictions[0], self.threshold)
            return {"accepted": result["is_real"], "isReal": result["is_real"],
                    "status": result["status"], "logitDiff": result["logit_diff"],
                    "modelVersion": self.version}


def create_app(engine_factory=LivenessEngine, secret=None, identity_factory=None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app):
        app.state.secret = secret if secret is not None else os.getenv("LIVENESS_SECRET", "")
        if not app.state.secret.strip():
            raise RuntimeError("Set LIVENESS_SECRET before starting the service")
        app.state.engine = engine_factory()
        app.state.identity = identity_factory() if identity_factory else None
        yield

    app = FastAPI(title="Smart Face Attendance Face Service", lifespan=lifespan)

    app.add_middleware(BodyLimit)

    @app.get("/health")
    def health(request: Request):
        identity = request.app.state.identity
        return {"status": "UP", "capability": "liveness-and-identity" if identity else "liveness-only",
                "identityAvailable": identity is not None, "modelVersion": request.app.state.engine.version}

    def authorize(request, authorization):
        expected = "Bearer " + request.app.state.secret
        if not hmac.compare_digest(authorization.encode(), expected.encode()):
            raise HTTPException(401, "Invalid service credentials")

    @app.post("/liveness")
    def liveness(body: ImageRequest, request: Request, authorization: str = Header(default="")):
        authorize(request, authorization)
        rgb = decode_image(body.image)
        try:
            return request.app.state.engine.check(rgb)
        except HTTPException:
            raise
        except Exception:
            logging.exception("Liveness inference failed")
            raise HTTPException(503, "Liveness inference failed") from None

    def identify(body, request, authorization, employee=None):
        authorize(request, authorization)
        engine = request.app.state.identity
        if engine is None:
            raise HTTPException(503, "Identity matching is not configured")
        rgb = decode_image(body.image)
        try:
            if not request.app.state.engine.check(rgb)["accepted"]:
                raise HTTPException(422, "Liveness check failed. Look directly at the camera and try again")
            return engine.enroll(employee, rgb) if employee is not None else engine.recognize(rgb)
        except HTTPException:
            raise
        except Exception:
            logging.exception("Identity operation failed")
            raise HTTPException(503, "Identity service unavailable") from None

    @app.post("/enroll")
    def enroll(body: EnrollmentRequest, request: Request, authorization: str = Header(default="")):
        return identify(body, request, authorization, body.employeeId)

    @app.post("/recognize")
    def recognize(body: ImageRequest, request: Request, authorization: str = Header(default="")):
        return identify(body, request, authorization)

    return app


app = create_app(identity_factory=IdentityEngine)
