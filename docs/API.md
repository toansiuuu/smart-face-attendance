# API and recognition contract

Local backend: `http://localhost:8081/api`. Frontend: `http://localhost:5173`, calling relative `/api` through Vite's proxy. Production should use one HTTPS origin. Cross-origin CORS access is intentionally not configured.

## Public camera

`POST /diem-danh` accepts scans without account authentication. `GET /auth/csrf` supplies the token/cookie for the public browser; `api.js` sends them automatically. CSRF is retained for mutations. This anonymous cookie is not a login or device-unlock requirement. Only POST on the attendance route is opened; employee lists, enrollment and reviews remain protected.

## Session login and CSRF

No JWT is used. The browser receives an HttpOnly JSESSIONID cookie. It identifies a server-side session; it is not an account password. JavaScript never stores passwords or tokens in localStorage.

1. GET `/auth/csrf`. Keep the returned cookie. Response has `token` and `headerName`.
2. POST `/auth/login` with that header/token, the same cookie and JSON `{"username":"admin","password":"YOUR_PASSWORD"}`.
3. Login creates a fresh session. Fetch `/auth/csrf` again before the next mutation.
4. Send the session cookie on subsequent requests. Include a current CSRF header for POST/PATCH. The frontend `src/api.js` handles this.
5. GET `/auth/me` returns the authenticated user. POST `/auth/logout` invalidates the session.

Postman automatically retains cookies when using the same host. Import `postman_collection.json`, set `baseUrl`, `username`, `password`, then run **Get CSRF → Login → Get CSRF → Me**. Do not send a Bearer token to this backend. The collection's mutation requests use `{{csrfHeader}}: {{csrfToken}}`.

| Method / path | Allowed user | Result / body |
|---|---|---|
| GET /health | Public | Process status; not a deep database check |
| GET /auth/csrf | Public | CSRF token for current cookie session |
| POST /auth/login | Public + CSRF | username, password → user |
| GET /auth/me | Account | id, username, role, employeeId, name |
| POST /auth/logout | Session + CSRF | Ends current session |
| POST /auth/password | Account + CSRF | currentPassword, newPassword; ends current session |
| GET /employees | Manager | Paged employee list; optional search |
| POST /employees | Manager | employeeCode, fullName, password; creates employee + EMPLOYEE account |
| PATCH /employees/{id} | Manager | fullName, status ACTIVE/INACTIVE |
| GET /shifts | Manager | Shared schedule versions and milestones |
| POST /shifts | Manager | shiftCode, shiftName, effectiveFrom, four milestones |
| GET /attendance?from=YYYY-MM-DD&to=YYYY-MM-DD | Account | Manager can filter employeeId; employee is always scoped to self |
| GET /policy | Account | Whether working weekdays are configured |
| GET /corrections | Account | All for manager; own for employee |
| POST /corrections | Employee | workDate, eventType, requestedTime HH:mm, reason |
| POST /corrections/{id}/review | Manager | approve boolean required, note optional ≤500 chars |
| POST /diem-danh | Public + CSRF | anhKhuonMat: JPEG data URL |
| POST /employees/{id}/face-enrollment | Manager | image: JPEG data URL |

Paged endpoints return `{items,total,page,size}`. Page starts at 0, size 1–200. Attendance range is at most 367 inclusive dates. This implementation assembles reports in memory before slicing; it is suitable for the student project, not large-company reporting volumes.

A milestone object is `{eventType,targetTime,windowStart,windowEnd}`. Valid eventType values in order: MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT.

Attendance rows include `date`, employee details, `timeIn`, `timeOut`, `status`, `workedMinutes`, `complete`, `milestones` (effective times), `rawMilestones` (original scans) and `shiftId`. Dates/times use Asia/Ho_Chi_Minh business time. No client-supplied employee id or scan timestamp is accepted at the live face-attendance endpoint.

Errors normally return `{message:...}`. 400 invalid input; 401 missing/expired session or invalid login; 403 role/CSRF; 404 missing resource; 409 conflict; 422 unaccepted face; 502/503 unavailable or invalid recognition provider. Password hashes are never returned.

## Liveness service — supplied ONNX models

Set `LIVENESS_URL` (default `http://localhost:8001`) and `LIVENESS_SECRET` on
the backend. Run the Python service with the same `LIVENESS_SECRET`; see
[deploy setup](../deploy/README.md). Both attendance scanning and enrollment
require successful liveness on the submitted image before identity matching.
Missing configuration, service outages, invalid responses, or spoof decisions
never fall back to successful enrollment/attendance.

`POST /api/face/liveness` is MANAGER-only and CSRF-protected. Body:
`{"image":"data:image/jpeg;base64,..."}`. It returns `accepted`, `isReal`,
`status`, and `modelVersion` without database writes. This remains available for
manager diagnostics; guided enrollment uses the challenge endpoints below. A successful liveness test alone
does not identify an employee or enroll their face.

## Identity recognition provider

Enrollment now requires an active head-turn challenge. Manager-only, CSRF-protected
Java endpoints are:

- `POST /api/employees/{id}/face-enrollment/challenge`: start a random-order
  straight/left/right/straight sequence.
- `POST /api/employees/{id}/face-enrollment/challenge/{challengeId}` with an
  `image` JPEG data URL: validate a frame and return the current step/pose.
- `POST /api/employees/{id}/face-enrollment` with `{"challengeId":"..."}`:
  save only after the challenge is complete. A single-image body is rejected.

Challenge tokens expire after 120 seconds, are bound to one employee, and are
consumed after enrollment. The Python service checks liveness and the same
identity on every accepted frame. See `deploy/README.md` for limits and details.

The full Docker launcher now configures the included Python SFace provider at
`http://liveness:8001`. It implements both endpoints below and persists embeddings
in the `face_data` volume. Standalone Java development can set `RECOGNITION_URL`
to `http://localhost:8001` and `RECOGNITION_SECRET` to the Python `LIVENESS_SECRET`.
No additional identity service is needed when using the full launcher.

Set backend environment variables `RECOGNITION_URL` and `RECOGNITION_SECRET`. Backend calls use `Authorization: Bearer <service-secret>` **only between backend and recognition provider**. Keep this secret out of frontend configuration.

POST `{RECOGNITION_URL}/enroll`:

```json
{"employeeId":1,"challengeId":"completed-server-challenge"}
```

POST `{RECOGNITION_URL}/recognize`:

```json
{"image":"data:image/jpeg;base64,..."}
```

Both success responses must be HTTP 200:

```json
{"accepted":true,"externalRef":"provider-person-unique-reference","modelVersion":"your-model-version"}
```

`externalRef` must be stable, unique and ≤120 characters. `modelVersion` is optional and ≤80. Re-enrollment should be idempotent for the same employee id. The identity provider must own match threshold and biometric storage policy. The separate supplied Python service performs liveness before these calls. An unaccepted face can return `{accepted:false}`.

The backend checks the reference against an active `face_enrollments` row and checks employee activity again while recording. It limits decoded JPEG data to 2,000,000 bytes and checks encoding/signature; the provider must fully decode and validate images. Connect timeout 5 seconds; request timeout 15 seconds.

Remote enrollment and a MySQL transaction are not one distributed transaction. If the remote service enrolls successfully but the local save fails, retry idempotently or reconcile the remote enrollment; no local success is reported. Scanning uses backend time after recognition finishes, so scans near a window boundary may move into the next window.

## Security and deployment limits

- Roles and enabled status are loaded from user_accounts on each account API request.
- Deactivation blocks linked-account access and future scans. No destructive employee deletion API exists.
- Authenticated sessions include a password fingerprint. Changing or recovering a password makes all earlier sessions fail their next identity check.
- Add request-size limits, login/scan throttling, TLS and secret management at the deployment boundary before public exposure.

## Password recovery (email / SMS)

- `GET /api/auth/password-recovery/options`: public; returns `emailEnabled` and
  `smsEnabled` based on global provider configuration, never on an account.
- `POST /api/auth/password-recovery/request`: public but CSRF-protected. Body:
  `{"username":"SV0003","channel":"EMAIL","contact":"registered@example.com"}`
  or channel `SMS` with the registered phone number. Returns a random `requestId`,
  generic `message`, `expiresInSeconds=600`, and `retryAfterSeconds=60`.
- `POST /api/auth/password-recovery/reset`: public but CSRF-protected. Body:
  `{"requestId":"UUID","code":"123456","newPassword":"a-new-long-password"}`.
  Returns a confirmation message on success; does not automatically log in.

Codes are generated with SecureRandom, BCrypt-hashed in MySQL, valid for ten
minutes, and consumed atomically. Five incorrect attempts lock that request.
Invalid/expired/reused codes return 400; excessive requests return 429; an
unconfigured channel returns 503. Unknown accounts and mismatched contacts receive
the same response structure and no delivery. Disabled accounts cannot recover.
Contact or password changes invalidate outstanding recovery requests.

SMTP/Twilio delivery runs after transaction commit on a bounded executor; codes,
destinations, credentials, and provider response bodies are never logged or
returned by these APIs. Provider failures are logged generically. Configuration
presence does not guarantee provider acceptance or delivery; inspect the provider
console when needed. No messages are sent by tests to real email/SMS accounts.

Rate limits persist in the recovery table and are serialized by the application's
single backend instance. A multi-instance deployment also needs a shared atomic
limiter. Records older than one day are cleaned up during recovery requests.
The backend creates this new table idempotently using `db/password-reset.sql`;
it does not recreate existing application tables.

See the README's recovery section and `.env.example` for setup.
