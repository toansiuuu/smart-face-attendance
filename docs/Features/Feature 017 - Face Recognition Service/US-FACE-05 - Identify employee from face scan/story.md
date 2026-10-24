# US-FACE-05 — Identify employee from face scan

| Field | Value |
|-------|-------|
| **Feature** | Face Recognition Service |
| **Domain** | FACE |

> As the recognition service, I want to compare a face scan against all enrolled face vectors and return the best-matching employee, so that the attendance system can automatically identify who is scanning.

## Acceptance Criteria

- AC1: Service exposes `POST /api/v1/identify` accepting a single image
- AC2: Performs face detection and feature extraction (same as US-FACE-04)
- AC3: Compares the extracted embedding against all enrolled employee embeddings using cosine similarity
- AC4: Identification threshold: cosine similarity ≥ 0.6 required for a positive match (configurable)
- AC5: Returns the best match: `{ identified: true, employee_id: 42, confidence: 0.87, distance: 0.13 }`
- AC6: If no match above threshold: `{ identified: false, best_match_confidence: 0.45, message: "No matching employee found" }` — Spring Boot backend returns this to the kiosk UI which prompts manual selection
- AC7: If the top two matches are within 0.05 confidence of each other, flag as ambiguous: `{ identified: false, ambiguous: true, message: "Multiple possible matches — please verify manually" }`
- AC8: `RecognitionClient.identify(imageBytes)` in Spring Boot calls this endpoint and maps the response to `RecognitionResult` DTO
- AC9: Performance target: identification across 500 enrolled employees should complete within 1 second
