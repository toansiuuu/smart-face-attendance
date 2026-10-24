# Feature 016 — Face Enrollment

| Field | Value |
|-------|-------|
| **Domain** | FACE |
| **Status** | Partially Implemented |

## Description

Allows employees to enroll their face data for recognition-based attendance. Includes capturing face images, uploading to the face recognition service, and managing enrollment status. The enrollment record tracks which employees have enrolled and provides a mechanism to re-enroll if face data needs updating.

## Implementation Status

Database table `face_enrollments` exists with columns: `id`, `employee_id`, `enrolled_at`, `model_version`, `status`. Entity class `FaceEnrollment.java` and repository `FaceEnrollmentRepository.java` are implemented. However, the actual face enrollment API endpoint and the integration with the external face recognition service (`RecognitionClient.java`) are **NOT YET BUILT** — `RecognitionClient` exists as a placeholder class but has no working implementation. The frontend enrollment UI does not exist yet. **BLOCKER**: The external face recognition service itself does not exist yet (see Feature 017).

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-FACE-01 | Capture and upload face images for enrollment | [story](US-FACE-01%20-%20Capture%20and%20upload%20face%20images%20for%20enrollment/story.md) |
| US-FACE-02 | View face enrollment status | [story](US-FACE-02%20-%20View%20face%20enrollment%20status/story.md) |
| US-FACE-03 | Re-enroll face data | [story](US-FACE-03%20-%20Re-enroll%20face%20data/story.md) |
