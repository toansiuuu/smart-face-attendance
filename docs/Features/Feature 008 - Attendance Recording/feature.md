# Feature 008 — Attendance Recording

| Field | Value |
|-------|-------|
| **Domain** | ATT |
| **Status** | Implemented |

## Description

Core attendance recording via face recognition scan. The camera captures an employee's face, the recognition service identifies them, and the backend records the attendance event with the appropriate milestone type based on the current time and active schedule.

## Implementation Status

Implemented in `FaceService.scan()` and `AttendanceService.record()`. The scan endpoint `POST /api/diem-danh` is `permitAll()` (no authentication required — designed for kiosk camera). Image validation checks JPEG header and 2MB size limit. The recognition service integration exists in `RecognitionClient.java` but the actual AI service is NOT YET BUILT (returns 503). Milestone determination uses `ShiftService.applicable(date)` to find the current schedule, then matches the scan time against milestone windows. Duplicate prevention: unique constraint on `(employee_id, work_date, event_type)`. Milestone ordering enforced by `AttendanceMath.ordered()`.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-ATT-03 | Record attendance via face scan | [story](US-ATT-03%20-%20Record%20attendance%20via%20face%20scan/story.md) |
| US-ATT-04 | Determine milestone type from scan time | [story](US-ATT-04%20-%20Determine%20milestone%20type%20from%20scan%20time/story.md) |
