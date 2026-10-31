import base64
from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import numpy as np
from PIL import Image

from service import create_app, LivenessEngine


def jpeg():
    stream = BytesIO()
    Image.new("RGB", (160, 160), "white").save(stream, format="JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(stream.getvalue()).decode()


class FakeEngine:
    version = "test-model"

    def check(self, image):
        return {"accepted": True, "isReal": True, "status": "real", "modelVersion": self.version}


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(create_app(FakeEngine, secret="test-secret"))
        self.client.__enter__()
        self.headers = {"Authorization": "Bearer test-secret"}

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def test_health_is_explicitly_liveness_only(self):
        self.assertFalse(self.client.get("/health").json()["identityAvailable"])

    def test_authentication_required(self):
        self.assertEqual(self.client.post("/liveness", json={"image": jpeg()}).status_code, 401)

    def test_valid_image(self):
        response = self.client.post("/liveness", json={"image": jpeg()}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["accepted"])
        self.assertNotIn("externalRef", response.json())

    def test_invalid_image(self):
        for image in ["invalid", "data:image/jpeg;base64,@@@", "data:image/jpeg;base64,YWJj"]:
            self.assertEqual(self.client.post("/liveness", json={"image": image},
                                            headers=self.headers).status_code, 400)

    def test_oversized_body(self):
        response = self.client.post("/liveness", content=b"x" * 2_900_001, headers=self.headers)
        self.assertEqual(response.status_code, 413)

    def test_spoof_is_not_accepted(self):
        with patch.object(FakeEngine, "check", return_value={"accepted": False, "isReal": False,
                                                           "status": "spoof", "modelVersion": "test"}):
            self.assertFalse(self.client.post("/liveness", json={"image": jpeg()},
                                             headers=self.headers).json()["accepted"])

    def test_missing_secret_prevents_startup(self):
        with self.assertRaises(RuntimeError):
            with TestClient(create_app(FakeEngine, secret="")):
                pass


class ModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LivenessEngine()

    def test_supplied_models_load_and_blank_image_is_rejected(self):
        with TestClient(create_app(lambda: self.engine, secret="test")) as client:
            response = client.post("/liveness", json={"image": jpeg()},
                                   headers={"Authorization": "Bearer test"})
            self.assertEqual(response.status_code, 422)

    def test_real_and_spoof_logits_and_inference_failure(self):
        face = {"bbox": {"x": 20, "y": 20, "width": 90, "height": 90}}
        with patch("service.detect", return_value=[face]):
            for logits, expected in [([4., -1.], True), ([-1., 4.], False)]:
                with patch("service.infer", return_value=[np.array(logits)]):
                    self.assertEqual(self.engine.check(np.zeros((160, 160, 3), dtype=np.uint8))["accepted"], expected)
            with patch("service.infer", return_value=[]):
                from fastapi import HTTPException
                with self.assertRaises(HTTPException) as error:
                    self.engine.check(np.zeros((160, 160, 3), dtype=np.uint8))
                self.assertEqual(error.exception.status_code, 503)

    def test_multiple_faces_rejected(self):
        with patch("service.detect", return_value=[{}, {}]):
            from fastapi import HTTPException
            with self.assertRaises(HTTPException) as error:
                self.engine.check(np.zeros((160, 160, 3), dtype=np.uint8))
            self.assertEqual(error.exception.status_code, 422)

    def test_supplied_liveness_model_runs_real_inference(self):
        from src.inference import infer
        predictions = infer([np.zeros((160, 160, 3), dtype=np.uint8)], self.engine.session,
                            self.engine.input_name, self.engine.image_size)
        self.assertEqual(len(predictions), 1)
        self.assertEqual(predictions[0].shape, (2,))
        self.assertTrue(np.isfinite(predictions[0]).all())


if __name__ == "__main__":
    unittest.main()
