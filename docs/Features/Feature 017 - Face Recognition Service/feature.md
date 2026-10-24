# Feature 017 — Face Recognition Service

| Field | Value |
|-------|-------|
| **Domain** | FACE |
| **Status** | Not Started |

## Description

The external AI-powered face recognition service that performs face detection, feature extraction, and identification. This is the core AI component of the Smart Face Attendance system. It runs as a separate microservice (likely Python-based with OpenCV/dlib/InsightFace) and communicates with the Spring Boot backend via REST API through `RecognitionClient.java`.

## Implementation Status

**NOT STARTED — CRITICAL BLOCKER.** `RecognitionClient.java` exists as a placeholder in the Spring Boot backend but has no working implementation. The face recognition service itself (the external microservice) does not exist yet. This is the single largest gap in the system — without it, face-based attendance (Feature 008, US-ATT-03) falls back to manual employee selection. This feature is Phase 1, Priority 1 in the improvement plan.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-FACE-04 | Detect and extract face from image | [story](US-FACE-04%20-%20Detect%20and%20extract%20face%20from%20image/story.md) |
| US-FACE-05 | Identify employee from face scan | [story](US-FACE-05%20-%20Identify%20employee%20from%20face%20scan/story.md) |
| US-FACE-06 | Handle recognition edge cases | [story](US-FACE-06%20-%20Handle%20recognition%20edge%20cases/story.md) |
