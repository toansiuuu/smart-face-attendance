# US-FACE-01 — Capture and upload face images for enrollment

| Field | Value |
|-------|-------|
| **Feature** | Face Enrollment |
| **Domain** | FACE |

> As a manager, I want to capture an employee's face images and enroll them in the face recognition service, so that the employee can be identified during attendance scans.

## Acceptance Criteria

- AC1: Enrollment page accessible from the Employee Detail view — "Enroll Face" button visible only for MANAGER role
- AC2: Enrollment UI uses the device camera via `navigator.mediaDevices.getUserMedia({ video: true })` to capture live images
- AC3: Capture at least 3 images from different angles (front, slight left, slight right) to improve recognition accuracy — UI guides the employee through each pose
- AC4: Captured images are sent as multipart form data to `POST /api/face-enrollments` with `employee_id` and image files
- AC5: Backend forwards images to the external face recognition service via `RecognitionClient.enroll(employeeId, images)` — **NOT YET IMPLEMENTED**
- AC6: On success: creates `face_enrollments` record with `status = ENROLLED`, `enrolled_at = now()`, `model_version` from service response
- AC7: On failure from recognition service (poor image quality, face not detected): returns `422 Unprocessable Entity` with specific error message — UI shows the error and allows retry
- AC8: Only one active enrollment per employee — if re-enrolling, the previous record is updated (not duplicated)
- AC9: Images are NOT stored in the application database — they are only forwarded to the recognition service which manages its own face vector storage
