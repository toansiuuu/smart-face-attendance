# Face service: liveness and employee identity

The service combines the supplied YuNet detector and anti-spoofing model with
OpenCV SFace identity recognition. `run-all.bat` (Windows) or `bash run-all.sh`
builds and configures the full application automatically.

## Enroll and scan

1. Log in as a manager and open an employee's face-enrollment dialog.
2. Capture a clear, front-facing photo with exactly one face.
3. Optionally use **Kiểm tra người thật** to test liveness without saving.
4. Click **Lưu khuôn mặt** to enroll. Both liveness and identity extraction must
   succeed before the employee is marked enrolled.
5. Open the camera kiosk at `/` to scan. The backend identifies an enrolled face,
   verifies the employee is active, and applies schedule/duplicate/order rules.

Re-enrollment replaces that employee's embedding while keeping the same external
reference. The service rejects a face already associated with another employee.
Unknown faces and close/ambiguous matches return actionable errors. Liveness
alone never identifies an employee or writes attendance.

## Storage

The Python service stores normalized 128-dimensional embeddings, employee IDs,
model versions, and stable references in SQLite. It does **not** store raw face
photos. Docker mounts the `face_data` volume at `/data`, so enrollment survives
container rebuilds and restarts. Preserve this volume together with MySQL;
`docker compose down -v` deletes both databases and requires re-enrollment.

A model-version mismatch stops startup rather than comparing incompatible
embeddings. Changing identity models requires a deliberate migration/re-enrollment.
A remote enrollment and MySQL save are not one distributed transaction; retries
are idempotent for the same employee if a later database save fails.

## Configuration

The full-project Compose configuration sets Java's `RECOGNITION_URL` and
`LIVENESS_URL` to `http://liveness:8001`, and uses the launcher's generated
`LIVENESS_SECRET` for both clients. Never put these secrets in frontend settings.

- `LIVENESS_THRESHOLD`: default 0.5; converted to the supplied logit threshold.
- `IDENTITY_THRESHOLD`: default 0.5 cosine similarity.
- `IDENTITY_MARGIN`: default 0.05 minimum gap between the best two identities.
- `IDENTITY_DB`: `/data/identity.sqlite3` in Docker; `deploy/data/identity.sqlite3`
  for local Python execution.
- `IDENTITY_MODEL`: defaults to `models/face_recognition_sface_2021dec.onnx`.
- `DETECTOR_MODEL` and `LIVENESS_MODEL`: optional overrides for liveness models.

Thresholds are starting values. Validate matching and spoof rejection using your
actual cameras, employees, lighting, and attack examples before deployment.

## Local Python development

Python 3.11 is recommended. From the project root:

```powershell
python -m venv deploy/.venv
deploy/.venv/Scripts/python.exe -m pip install -r deploy/requirements-dev.txt
$env:LIVENESS_SECRET = 'replace-with-a-long-random-secret'
./run-liveness.bat
```

In the Java terminal, set the same secret and the local URLs:

```powershell
$env:LIVENESS_SECRET = 'replace-with-a-long-random-secret'
$env:LIVENESS_URL = 'http://localhost:8001'
$env:RECOGNITION_SECRET = $env:LIVENESS_SECRET
$env:RECOGNITION_URL = 'http://localhost:8001'
./run-backend.bat
```

The service loads all models at startup and refuses to start without the shared
secret or required models. SFace provenance, checksum, and license are in
`models/SFACE-SOURCE.md` and `models/SFACE-LICENSE`.

## API

Every POST requires `Authorization: Bearer <LIVENESS_SECRET>`.

- `POST /liveness`: `{"image":"data:image/jpeg;base64,..."}` returns `accepted`,
  `isReal`, `status`, `logitDiff`, and `modelVersion`; writes nothing.
- `POST /enroll`: `{"employeeId":1,"image":"data:image/jpeg;base64,..."}`
  performs liveness and enrollment; returns `accepted`, `externalRef`, `modelVersion`.
- `POST /recognize`: `{"image":"data:image/jpeg;base64,..."}` performs liveness
  and identity matching; returns the same stable reference for a recognized face.
- `GET /health`: reports `identityAvailable=true` and `capability=liveness-and-identity`.

No face/unknown/ambiguous/spoof errors return 422, duplicate enrollment returns
409, malformed JPEGs return 400, oversized requests return 413, and inference or
storage failures return 503. JPEGs are limited to 2 MB and 12 million pixels.

The browser calls Java, never these authenticated endpoints directly. Java keeps
manager-only enrollment, CSRF, active-employee checks, and official server timing.

## Tests

```powershell
cd deploy
.venv/Scripts/python.exe -m unittest -v test_service test_identity
```

Tests cover actual ONNX inference, actual SFace feature extraction, gallery
persistence, re-enrollment, unknown and ambiguous matches, duplicate prevention,
API authentication, image limits, and required liveness. Optional OpenCV sample
photographs exercise detection, landmark alignment, and identity matching in a
temporary gallery; no fixture is enrolled in the running attendance database.

References: [SFace model](https://github.com/opencv/opencv_zoo/tree/eb9f4f2d4b79b58e5513b5d25d5f0243a8357bf4/models/face_recognition_sface),
[OpenCV recognition tutorial](https://docs.opencv.org/4.11.0/d0/dd4/tutorial_dnn_face.html).
