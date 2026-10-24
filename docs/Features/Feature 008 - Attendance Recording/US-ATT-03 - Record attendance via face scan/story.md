# US-ATT-03 — Record attendance via face scan

| Field | Value |
|-------|-------|
| **Feature** | Attendance Recording |
| **Domain** | ATT |

> As an employee, I want to scan my face at the camera kiosk to record my attendance, so that my check-in and check-out times are captured automatically.

## Acceptance Criteria

- AC1: Camera kiosk page at `/camera` — opens webcam via `getUserMedia({ video: true })`
- AC2: Live camera feed displayed with face detection frame overlay
- AC3: Employee clicks "Capture" — canvas captures the current frame and converts to base64 JPEG
- AC4: Frontend sends `POST /api/diem-danh` with JSON `{ anhKhuonMat: "<base64>" }` — no session/CSRF required (permitAll endpoint for kiosk use)
- AC5: Backend validates image: must start with JPEG header bytes (0xFF 0xD8), maximum 2MB
- AC6: Backend calls Recognition Service via `RecognitionClient.call("/recognize", image, null)` with Bearer token authentication
- AC7: Recognition Service returns `{ accepted: true, externalRef: "emp_XXX" }` on match
- AC8: Backend looks up `face_enrollments` by `external_ref` to find the employee
- AC9: Backend calls `AttendanceService.record(employeeId, now, null)` to create the attendance event
- AC10: On success: returns `{ employeeName, time, shift, status }` — frontend displays SUCCESS screen with employee name and attendance result, auto-dismisses after 5 seconds
- AC11: On recognition failure (no match): return error, frontend displays FAILED screen
- AC12: On recognition service unavailable: return `503 Service Unavailable`
