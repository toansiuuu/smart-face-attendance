"""SFace identity matching with a persistent, versioned SQLite embedding gallery."""

import hashlib
import math
import os
from pathlib import Path
import sqlite3
import threading

import cv2
from fastapi import HTTPException
import numpy as np


class IdentityEngine:
    def __init__(self, database=None):
        root = Path(__file__).resolve().parent
        model = Path(os.getenv("IDENTITY_MODEL", root / "models/face_recognition_sface_2021dec.onnx"))
        self.version = "sface-" + hashlib.sha256(model.read_bytes()).hexdigest()[:16]
        self.recognizer = cv2.FaceRecognizerSF.create(str(model), "")
        self.detector = cv2.FaceDetectorYN.create(
            str(root / "models/detector_quantized.onnx"), "", (320, 320), 0.8, 0.3, 5000)
        self.threshold = float(os.getenv("IDENTITY_THRESHOLD", "0.5"))
        self.margin = float(os.getenv("IDENTITY_MARGIN", "0.05"))
        if not math.isfinite(self.threshold) or not 0 < self.threshold <= 1:
            raise RuntimeError("IDENTITY_THRESHOLD must be in (0, 1]")
        if not math.isfinite(self.margin) or not 0 <= self.margin <= 1:
            raise RuntimeError("IDENTITY_MARGIN must be in [0, 1]")
        self.database = Path(database or os.getenv("IDENTITY_DB", root / "data/identity.sqlite3"))
        self.database.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        with self.connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS identities (employee_id INTEGER PRIMARY KEY, "
                       "external_ref TEXT UNIQUE NOT NULL, model_version TEXT NOT NULL, embedding BLOB NOT NULL)")
            if db.execute("SELECT 1 FROM identities WHERE model_version != ? LIMIT 1", (self.version,)).fetchone():
                raise RuntimeError("Gallery model differs from identity model; migrate/re-enroll before changing models")

    def connect(self):
        return sqlite3.connect(self.database, timeout=15)

    def embedding(self, rgb):
        return self.analyze(rgb)[0]

    def analyze(self, rgb):
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        height, width = bgr.shape[:2]
        with self.lock:
            self.detector.setInputSize((width, height))
            _, faces = self.detector.detect(bgr)
            if faces is None or len(faces) != 1:
                raise HTTPException(422, "Show exactly one face to enroll or recognize")
            x, y, w, h = faces[0][:4]
            if min(w, h) < 60 or min(x, y, width - x - w, height - y - h) < 5:
                raise HTTPException(422, "Move your face into the frame and closer to the camera")
            aligned = self.recognizer.alignCrop(bgr, faces[0])
            feature = self.recognizer.feature(aligned).reshape(-1).copy()
            turn = self.turn_ratio(faces[0])
        return self.normalize(feature), turn

    @staticmethod
    def turn_ratio(face):
        eye1, eye2, nose = face[4:6], face[6:8], face[8:10]
        eye_axis = eye2 - eye1
        eye_distance = float(np.linalg.norm(eye_axis))
        if eye_distance < 15:
            raise HTTPException(422, "Move closer so both eyes are visible")
        # Signed nose displacement along the eye line; independent of translation/scale/roll.
        axis = eye_axis / eye_distance
        if axis[0] < 0:
            axis = -axis
        return float(np.dot(nose - (eye1 + eye2) / 2, axis) / eye_distance)

    @staticmethod
    def normalize(feature):
        feature = np.asarray(feature, dtype=np.float32).reshape(-1)
        norm = float(np.linalg.norm(feature))
        if feature.size != 128 or not np.isfinite(feature).all() or norm < 1e-8:
            raise HTTPException(503, "Invalid identity embedding")
        return feature / norm

    def ranked(self, db, feature, exclude=None):
        candidates = []
        for employee, reference, blob in db.execute(
                "SELECT employee_id, external_ref, embedding FROM identities WHERE model_version=?", (self.version,)):
            if employee == exclude:
                continue
            stored = self.normalize(np.frombuffer(blob, dtype=np.float32))
            candidates.append((float(np.dot(feature, stored)), reference))
        return sorted(candidates, reverse=True)

    def enroll(self, employee, rgb):
        feature = self.embedding(rgb)
        return self.enroll_feature(employee, feature)

    def enroll_feature(self, employee, feature):
        feature = self.normalize(feature)
        reference = f"employee-{employee}"
        with self.connect() as db:
            # Serialize duplicate checks and writes, including requests for different employees.
            db.execute("BEGIN IMMEDIATE")
            ranked = self.ranked(db, feature, exclude=employee)
            if ranked and ranked[0][0] >= self.threshold:
                raise HTTPException(409, "This face is already enrolled for another employee")
            db.execute("INSERT INTO identities VALUES (?, ?, ?, ?) ON CONFLICT(employee_id) DO UPDATE SET "
                       "embedding=excluded.embedding, model_version=excluded.model_version",
                       (employee, reference, self.version, feature.tobytes()))
        return {"accepted": True, "externalRef": reference, "modelVersion": self.version}

    def recognize(self, rgb):
        feature = self.embedding(rgb)
        with self.connect() as db:
            ranked = self.ranked(db, feature)
        if not ranked or ranked[0][0] < self.threshold:
            raise HTTPException(422, "Face is not recognized. Ask a manager to enroll it first")
        if len(ranked) > 1 and ranked[0][0] - ranked[1][0] < self.margin:
            raise HTTPException(422, "Face match is ambiguous. Please capture a clearer image")
        return {"accepted": True, "externalRef": ranked[0][1], "modelVersion": self.version}
