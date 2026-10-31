import unittest
from unittest.mock import patch

from fastapi import HTTPException
import numpy as np

from enrollment import EnrollmentChallenges


class Clock:
    now = 100.0
    def __call__(self):
        return self.now


class Live:
    accepted = True
    def check(self, rgb):
        return {"accepted": self.accepted}


class Identity:
    threshold = 0.5
    turn = 0.0
    def __init__(self):
        self.feature = np.eye(128, dtype=np.float32)[0]
        self.saved = []
    def analyze(self, rgb):
        return self.feature.copy(), self.turn
    def enroll_feature(self, employee, feature):
        self.saved.append(employee)
        return {"accepted": True, "externalRef": f"employee-{employee}", "modelVersion": "test"}


class ChallengeTests(unittest.TestCase):
    def setUp(self):
        self.clock, self.live, self.identity = Clock(), Live(), Identity()
        self.challenges = EnrollmentChallenges(self.live, self.identity, self.clock)
        self.number = 0
        self.started = self.challenges.start(3)
        self.token = self.started["challengeId"]

    def frame(self, turn=0, employee=3):
        self.clock.now += 0.5
        self.identity.turn = turn
        self.number += 1
        return self.challenges.frame(self.token, employee, np.full((8, 8, 3), self.number, dtype=np.uint8))

    def complete(self):
        result = self.started
        for _ in range(8):
            turn = {"CENTER": 0., "LEFT": 0.25, "RIGHT": -0.25}[result["pose"]]
            result = self.frame(turn)
        return result

    def test_both_random_orders_need_two_live_frames_per_pose(self):
        for choice in [0, 1]:
            with patch("enrollment.secrets.randbelow", return_value=choice):
                self.started = self.challenges.start(3)
                self.token = self.started["challengeId"]
                result = self.complete()
                self.assertTrue(result["complete"])
                self.assertEqual(self.identity.saved, [])
                self.assertTrue(self.challenges.finish(self.token, 3)["accepted"])
                self.identity.saved.clear()
                with self.assertRaises(HTTPException):
                    self.challenges.finish(self.token, 3)

    def test_static_pose_and_wrong_direction_never_complete(self):
        for _ in range(10):
            result = self.frame(0)
        self.assertEqual(result["step"], 1)
        wrong = -0.3 if result["pose"] == "LEFT" else 0.3
        self.assertEqual(self.frame(wrong)["step"], 1)
        with self.assertRaises(HTTPException) as error:
            self.challenges.finish(self.token, 3)
        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(self.identity.saved, [])

    def test_spoof_and_different_person_fail(self):
        self.frame()
        self.live.accepted = False
        with self.assertRaises(HTTPException):
            self.frame()
        self.live.accepted = True
        self.identity.feature = np.eye(128, dtype=np.float32)[1]
        with self.assertRaises(HTTPException):
            self.frame()
        self.assertEqual(self.identity.saved, [])

    def test_expired_and_wrong_employee_tokens_fail(self):
        with self.assertRaises(HTTPException):
            self.frame(employee=4)
        self.clock.now += 121
        with self.assertRaises(HTTPException) as error:
            self.challenges.finish(self.token, 3)
        self.assertEqual(error.exception.status_code, 410)

    def test_duplicate_and_too_fast_frames_do_not_advance(self):
        image = np.zeros((8, 8, 3), dtype=np.uint8)
        self.challenges.frame(self.token, 3, image)
        self.assertEqual(self.challenges.frame(self.token, 3, image)["step"], 0)
        self.clock.now += 0.5
        self.assertEqual(self.challenges.frame(self.token, 3, image)["step"], 0)

    def test_starting_again_invalidates_previous_attempt(self):
        self.challenges.start(3)
        with self.assertRaises(HTTPException):
            self.frame()


if __name__ == "__main__":
    unittest.main()
