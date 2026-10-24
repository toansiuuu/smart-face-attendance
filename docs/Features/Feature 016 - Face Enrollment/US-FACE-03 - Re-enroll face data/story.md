# US-FACE-03 — Re-enroll face data

| Field | Value |
|-------|-------|
| **Feature** | Face Enrollment |
| **Domain** | FACE |

> As a manager, I want to re-enroll an employee's face data, so that recognition accuracy is maintained when the employee's appearance changes significantly or the recognition model is updated.

## Acceptance Criteria

- AC1: "Re-enroll" button available on the enrollment detail view for employees with `status = ENROLLED`
- AC2: Re-enrollment follows the same capture flow as initial enrollment (US-FACE-01) — 3 images from different angles
- AC3: `PUT /api/face-enrollments/{employeeId}` sends new images to the recognition service via `RecognitionClient.enroll(employeeId, images)` — the service replaces the existing face vectors
- AC4: On success: updates existing `face_enrollments` record — `enrolled_at = now()`, `model_version` updated, `status` remains `ENROLLED`
- AC5: On failure: existing enrollment data in the recognition service is preserved (atomic operation — old vectors are not deleted until new ones are confirmed)
- AC6: Audit trail: the `enrolled_at` timestamp change serves as a record of re-enrollment — for full audit history, see Feature 021 (Audit Logging)
- AC7: Batch re-enrollment notification: when the recognition model is updated (`model_version` changes), the system flags all employees as "Re-enrollment recommended" — but does not invalidate existing enrollments
