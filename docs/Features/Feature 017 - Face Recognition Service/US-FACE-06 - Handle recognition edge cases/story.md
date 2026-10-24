# US-FACE-06 — Handle recognition edge cases

| Field | Value |
|-------|-------|
| **Feature** | Face Recognition Service |
| **Domain** | FACE |

> As the system, I want to handle common recognition failure scenarios gracefully, so that employees can still record attendance even when face recognition fails or is unreliable.

## Acceptance Criteria

- AC1: **Poor lighting**: If face is detected but image quality is too low (blur score, brightness), return `422` with `{ error: "LOW_QUALITY", message: "Image quality too low — please ensure adequate lighting" }` — kiosk UI prompts retry
- AC2: **Glasses/mask**: Recognition model should handle common accessories (glasses, light masks). If confidence drops below threshold due to accessories, system falls back to manual selection — does NOT reject the scan attempt
- AC3: **Service unavailable**: If the recognition service is down, `RecognitionClient` catches the connection error and throws a custom exception. `POST /api/diem-danh` catches this and returns `503 Service Unavailable` with `{ error: "RECOGNITION_SERVICE_DOWN" }`. Kiosk UI shows "Face recognition temporarily unavailable — please select your name manually"
- AC4: **Timeout**: `RecognitionClient` has a 5-second timeout for identify calls. On timeout, same fallback as service unavailable
- AC5: **Spoofing prevention (Phase 2)**: Liveness detection to prevent photo/video spoofing — basic version checks for eye blink or slight head movement during capture. Not required for MVP but architecture should allow adding it
- AC6: **Rate limiting**: Recognition service limits to 10 requests/second per client to prevent abuse. Spring Boot respects `429 Too Many Requests` and queues or retries with exponential backoff
- AC7: **Logging**: All recognition attempts (success, failure, edge cases) are logged with timestamp, employee_id (if identified), confidence score, and error type for debugging and model improvement
