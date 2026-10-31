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
            for path, body in [("/enroll", {"image": jpeg(), "employeeId": 1}),
                               ("/recognize", {"image": jpeg()})]:
                self.assertEqual(client.post(path, json=body).status_code, 401)
            with patch.object(self.engine, "embedding", return_value=self.a):
                enrolled = client.post("/enroll", headers=headers, json={"image": jpeg(), "employeeId": 1})
                self.assertEqual(enrolled.status_code, 200)
                recognized = client.post("/recognize", headers=headers, json={"image": jpeg()})
                self.assertEqual(recognized.json()["externalRef"], enrolled.json()["externalRef"])
                self.assertEqual(client.post("/enroll", headers=headers,
                                            json={"image": jpeg(), "employeeId": 0}).status_code, 422)
            with patch.object(FakeEngine, "check", return_value={"accepted": False}):
                with patch.object(self.engine, "embedding") as embed:
                    self.assertEqual(client.post("/enroll", headers=headers,
                                     json={"image": jpeg(), "employeeId": 9}).status_code, 422)
                    self.assertEqual(client.post("/recognize", headers=headers,
                                     json={"image": jpeg()}).status_code, 422)
                    embed.assert_not_called()


if __name__ == "__main__":
    unittest.main()
