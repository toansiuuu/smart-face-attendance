"""Short-lived, employee-bound head-turn challenges. No camera frames are stored."""
import hashlib
import secrets
import threading
import time

from fastapi import HTTPException
import numpy as np


class EnrollmentChallenges:
    def __init__(self, liveness, identity, clock=time.monotonic):
        self.liveness, self.identity, self.clock = liveness, identity, clock
        self.sessions = {}
        self.lock = threading.Lock()

    def start(self, employee):
        with self.lock:
            now = self.clock()
            self.sessions = {key: value for key, value in self.sessions.items()
                             if value["expires"] > now and value["employee"] != employee}
            if len(self.sessions) >= 32:
                raise HTTPException(429, "Too many enrollment attempts. Please retry shortly")
            turns = ["LEFT", "RIGHT"] if secrets.randbelow(2) else ["RIGHT", "LEFT"]
            token = secrets.token_urlsafe(32)
            session = {"employee": employee, "sequence": ["CENTER", *turns, "CENTER"],
                       "step": 0, "stable": 0, "baseline": None, "feature": None,
                       "last": -float("inf"), "digest": None, "expires": now + 120}
            self.sessions[token] = session
            return {"challengeId": token, **self.view(session)}

    def get(self, token, employee):
        session = self.sessions.get(token)
        if session is None or session["employee"] != employee:
            raise HTTPException(410, "Enrollment challenge is invalid. Start again")
        if session["expires"] <= self.clock():
            del self.sessions[token]
            raise HTTPException(410, "Enrollment challenge expired. Start again")
        return session

    @staticmethod
    def view(session, message=""):
        return {"step": session["step"], "totalSteps": 4,
                "pose": session["sequence"][session["step"]] if session["step"] < 4 else "DONE",
                "complete": session["step"] == 4, "message": message}

    def frame(self, token, employee, rgb):
        with self.lock:
            session = self.get(token, employee)
            if session["step"] == 4:
                return self.view(session)
            now = self.clock()
            if now - session["last"] < 0.35:
                return self.view(session)
            session["last"] = now
            digest = hashlib.sha256(rgb.tobytes()).digest()
            if digest == session["digest"]:
                session["stable"] = 0
                return self.view(session, "Giữ camera trực tiếp và cử động tự nhiên.")
            session["digest"] = digest
            try:
                if not self.liveness.check(rgb)["accepted"]:
                    raise HTTPException(422, "Không vượt qua kiểm tra người thật. Nhìn rõ vào camera.")
                feature, turn = self.identity.analyze(rgb)
                if not np.isfinite(turn):
                    raise HTTPException(422, "Không đọc được hướng khuôn mặt. Hãy thử lại.")
                if session["feature"] is not None and float(np.dot(session["feature"], feature)) < self.identity.threshold:
                    raise HTTPException(422, "Khuôn mặt đã thay đổi. Chỉ một người thực hiện toàn bộ bước.")
            except HTTPException:
                session["stable"] = 0
                raise
            pose = session["sequence"][session["step"]]
            baseline = session["baseline"] or 0.0
            delta = turn - baseline
            matched = (abs(delta) <= 0.10 if pose == "CENTER" else
                       delta >= 0.18 if pose == "LEFT" else delta <= -0.18)
            if session["step"] == 0:
                matched = abs(turn) <= 0.15
            if not matched:
                session["stable"] = 0
                return self.view(session, "Xoay đầu nhẹ theo hướng dẫn, giữ cả hai mắt trong khung.")
            if session["step"] == 0 and session["feature"] is None:
                session["baseline"] = turn
                session["feature"] = feature.copy()
            session["stable"] += 1
            if session["stable"] >= 2:
                session["step"] += 1
                session["stable"] = 0
            return self.view(session)

    def finish(self, token, employee):
        with self.lock:
            session = self.get(token, employee)
            if session["step"] != 4:
                raise HTTPException(409, "Complete the straight/left/right head-turn challenge before enrollment")
            result = self.identity.enroll_feature(employee, session["feature"])
            del self.sessions[token]
            return result
