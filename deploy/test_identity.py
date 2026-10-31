from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import cv2
from fastapi import HTTPException
from fastapi.testclient import TestClient
import numpy as np

from identity import IdentityEngine
from service import create_app
from test_service import FakeEngine, jpeg


class IdentityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / "identity.sqlite3"
        self.engine = IdentityEngine(self.database)
        self.a = np.eye(128, dtype=np.float32)[0]
        self.b = np.eye(128, dtype=np.float32)[1]

    def tearDown(self):
        self.temp.cleanup()

    def test_enrollment_recognition_persistence_and_reenrollment(self):
        with patch.object(self.engine, "embedding", return_value=self.a):
            first = self.engine.enroll(3, None)
            self.assertEqual(self.engine.recognize(None)["externalRef"], first["externalRef"])
            self.assertEqual(self.engine.enroll(3, None)["externalRef"], first["externalRef"])
        restored = IdentityEngine(self.database)
        with patch.object(restored, "embedding", return_value=self.a):
            self.assertEqual(restored.recognize(None)["externalRef"], "employee-3")
        with patch.object(self.engine, "embedding", return_value=self.b):
            self.engine.enroll(3, None)
        with patch.object(self.engine, "embedding", return_value=self.a):
            with self.assertRaises(HTTPException):
                self.engine.recognize(None)

    def test_unknown_and_duplicate_faces_are_rejected(self):
        with patch.object(self.engine, "embedding", return_value=self.a):
            with self.assertRaises(HTTPException):
                self.engine.recognize(None)
            self.engine.enroll(1, None)
            with self.assertRaises(HTTPException) as error:
                self.engine.enroll(2, None)
            self.assertEqual(error.exception.status_code, 409)
        with patch.object(self.engine, "embedding", return_value=self.b):
            with self.assertRaises(HTTPException) as error:
                self.engine.recognize(None)
            self.assertEqual(error.exception.status_code, 422)

    def test_ambiguous_match_is_rejected(self):
        with patch.object(self.engine, "embedding", return_value=self.a):
            self.engine.enroll(1, None)
        with patch.object(self.engine, "embedding", return_value=self.b):
            self.engine.enroll(2, None)
        with patch.object(self.engine, "embedding", return_value=(self.a + self.b) / np.sqrt(2)):
            with self.assertRaises(HTTPException) as error:
                self.engine.recognize(None)
            self.assertIn("ambiguous", error.exception.detail)

    def test_model_mismatch_fails_startup(self):
        with self.engine.connect() as db:
            db.execute("INSERT INTO identities VALUES (1, 'employee-1', 'old-model', ?)", (self.a.tobytes(),))
        with self.assertRaises(RuntimeError):
            IdentityEngine(self.database)

    def test_actual_sface_model_produces_embedding_and_rejects_blank_detection(self):
        feature = self.engine.recognizer.feature(np.full((112, 112, 3), 127, dtype=np.uint8))
        self.assertEqual(feature.size, 128)
        self.assertTrue(np.isfinite(self.engine.normalize(feature)).all())
        with self.assertRaises(HTTPException):
            self.engine.embedding(np.zeros((160, 160, 3), dtype=np.uint8))

    def test_turn_ratio_uses_landmarks_and_ignores_translation_scale_and_roll(self):
        face = np.zeros(15, dtype=np.float32)
        points = np.array([[100., 100.], [200., 100.], [180., 150.]])
        for angle, scale, offset in [(0, 1, 0), (0.3, 2, 300), (-0.3, 1.5, 50)]:
            rotation = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
            face[4:10] = ((points @ rotation.T) * scale + offset).reshape(-1)
            self.assertAlmostEqual(self.engine.turn_ratio(face), 0.3, places=5)
        face[4:10] = np.array([[100., 100.], [200., 100.], [120., 150.]]).reshape(-1)
        self.assertAlmostEqual(self.engine.turn_ratio(face), -0.3, places=5)

    def test_face_photographs_if_available(self):
        fixtures = Path(__file__).parent / "testdata"
        if not (fixtures / "lena.jpg").exists() or not (fixtures / "messi5.jpg").exists():
            self.skipTest("Optional OpenCV face photographs not downloaded")
        lena = cv2.cvtColor(cv2.imread(str(fixtures / "lena.jpg")), cv2.COLOR_BGR2RGB)
        messi = cv2.cvtColor(cv2.imread(str(fixtures / "messi5.jpg")), cv2.COLOR_BGR2RGB)
        # The sample is a wide scene; enlarge it so its face meets the camera-quality limit.
        messi = cv2.resize(messi, None, fx=3, fy=3)
        self.engine.enroll(1, lena)
        self.assertEqual(self.engine.recognize(lena)["externalRef"], "employee-1")
        with self.assertRaises(HTTPException):
            self.engine.recognize(messi)
        self.engine.enroll(2, messi)
        self.assertEqual(self.engine.recognize(messi)["externalRef"], "employee-2")

    def test_authenticated_api_and_liveness_gate(self):
        headers = {"Authorization": "Bearer test"}
        with TestClient(create_app(FakeEngine, secret="test", identity_factory=lambda: self.engine)) as client:
            self.assertTrue(client.get("/health").json()["identityAvailable"])
            self.assertEqual(client.post("/enrollment/start", json={"employeeId": 1}).status_code, 401)
            started = client.post("/enrollment/start", headers=headers, json={"employeeId": 1}).json()
            token = started["challengeId"]
            body = {"employeeId": 1, "challengeId": token}
            self.assertEqual(client.post("/enroll", json=body).status_code, 401)
            self.assertEqual(client.post("/enroll", headers=headers, json=body).status_code, 409)
            self.assertEqual(client.post("/enroll", headers=headers,
                             json={"employeeId": 1, "image": jpeg()}).status_code, 422)
            with patch.object(FakeEngine, "check", return_value={"accepted": False}):
                with patch.object(self.engine, "analyze") as analyze:
                    response = client.post("/enrollment/frame", headers=headers,
                                           json={**body, "image": jpeg()})
                    self.assertEqual(response.status_code, 422)
                    self.assertEqual(client.post("/recognize", headers=headers,
                                     json={"image": jpeg()}).status_code, 422)
                    analyze.assert_not_called()
            self.engine.enroll_feature(1, self.a)
            with patch.object(self.engine, "embedding", return_value=self.a):
                recognized = client.post("/recognize", headers=headers, json={"image": jpeg()})
                self.assertEqual(recognized.json()["externalRef"], "employee-1")

if __name__ == "__main__":
    unittest.main()
