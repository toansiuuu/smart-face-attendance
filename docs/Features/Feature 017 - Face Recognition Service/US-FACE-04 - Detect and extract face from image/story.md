# US-FACE-04 — Detect and extract face from image

| Field | Value |
|-------|-------|
| **Feature** | Face Recognition Service |
| **Domain** | FACE |

> As the recognition service, I want to detect a human face in a captured image and extract its feature vector, so that it can be stored during enrollment or compared during identification.

## Acceptance Criteria

- AC1: Service exposes `POST /api/v1/detect` accepting a single image (JPEG/PNG, max 5MB)
- AC2: Face detection using a pre-trained model (e.g., MTCNN, RetinaFace, or MediaPipe Face Detection) — returns bounding box coordinates and confidence score
- AC3: If no face detected in the image, return `422` with `{ error: "NO_FACE_DETECTED", message: "No human face found in the image" }`
- AC4: If multiple faces detected, return `422` with `{ error: "MULTIPLE_FACES", message: "Multiple faces detected — please ensure only one person is in frame" }`
- AC5: Face alignment and normalization: rotate, crop, and resize the detected face to a standard size (e.g., 112×112 pixels) before feature extraction
- AC6: Feature extraction using a face recognition model (e.g., ArcFace, FaceNet) — produces a 128D or 512D embedding vector
- AC7: Detection confidence threshold: reject faces with detection confidence below 0.9 to ensure quality
- AC8: Response includes: `{ face_detected: true, confidence: 0.97, embedding: [...], bbox: {x, y, w, h} }`
- AC9: Processing time target: under 500ms per image on GPU, under 2000ms on CPU
