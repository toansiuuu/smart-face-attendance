# How to understand the code

Read one flow at a time. Start with login, because every protected feature builds on it.

## 1. Login

1. React `frontend/src/components/Login.jsx`: you submit username/password. `handleLogin` calls `api('/auth/login', ...)`.
2. `frontend/src/api.js`: gets a CSRF token, sends JSON, and includes the session cookie automatically with `credentials: 'include'`.
3. Java `config/SecurityConfig.java`: allows the login URL through, but still checks CSRF for POST.
4. `controller/AuthController.java`, method `login`: reads the request DTO, asks `AccountRepository` for the username, and checks the password with BCrypt `matches`.
5. `service/IdentityService.java`: verifies the account is enabled and any linked employee is active.
6. `AuthController` creates a fresh session, stores the authenticated security context and returns a safe user response. It does **not** insert a new account on login.
7. React routes MANAGER to `/admin`, EMPLOYEE to `/employee`. `Protected.jsx` checks `/auth/me` on page entry. Backend role checks remain the actual authority.

The session principal also stores a fingerprint of the password hash.
`IdentityService.current` compares it with the current account on each identity
check, so changing or recovering a password makes earlier sessions invalid.

### Forgot password

`ForgotPasswordDialog.jsx` checks globally enabled email/SMS channels, then submits
username, channel, and the registered contact to `PasswordRecoveryController`.
`PasswordRecoveryService` applies persisted rate limits, generates a six-digit OTP,
and stores only its BCrypt hash with a ten-minute expiry and attempt counter.
The response is the same for unknown accounts and mismatched contacts.

After the transaction commits, `RecoveryDelivery` sends through SMTP or Twilio
on a bounded background executor. It never logs the OTP or recipient. When the
user submits the OTP and a new password, row locks enforce one successful use;
five incorrect attempts lock the request. The service rechecks account activity,
contact, and password fingerprint before saving the new BCrypt password hash.
The browser returns to login; it does not receive an authenticated session.

Provider settings are supplied through the root `.env` for Docker. Without them,
the corresponding delivery channel stays disabled in the UI. The backend applies
the additive `db/password-reset.sql` startup script for existing databases.

POST means “process this submitted data.” It does not always mean insert a database row. Login processes credentials and creates session state.

## 2. First manager setup

`config/DevelopmentSetup.java` is active only with profile `dev`. Its `@Bean` method returns a `CommandLineRunner`. Spring manages that object and calls it after startup. If DEV_ADMIN_PASSWORD is set and no MANAGER exists, it hashes the password and saves an account. It does not recreate the database or reset an existing manager.

A database connection failure occurs before this runner can create anything. Fix MySQL credentials first when the log says `Access denied`.

## 3. Add employee

`Dashboard.jsx` form → `api.js` → `ManagementController.create` → manager permission check → `EmployeeService.create` → employee and account repositories → existing `employees` and `user_accounts`.

`@Transactional` groups both writes: a failure rolls them back together. The frontend sends no role; the service always chooses EMPLOYEE. The password hash stays in the database.

## 4. Face attendance

`FaceCapture.jsx` captures a JPEG → `/diem-danh` → `FaceAttendanceController.scan` accepts the public scan (CSRF protected) → `FaceService.scan` requires `LivenessClient` to accept the image → `RecognitionClient` identifies the face → active external reference identifies employee → `AttendanceService.record` locks the employee row, selects schedule and scan window, checks duplicates/order, then inserts `attendance_events`.

The Python face service lives in `deploy/service.py`; `deploy/identity.py` adds OpenCV SFace identity extraction, persistent enrollment, and matching. The supplied detector and anti-spoofing ONNX models remain required for liveness. The manager-only `/api/face/liveness` endpoint remains available for diagnostic API calls; it writes nothing. The enrollment dialog uses the head-turn challenge in `deploy/enrollment.py` before storing the employee embedding. The full launcher configures both Java clients automatically. See `deploy/README.md` for configuration.

The browser never chooses the employee id or official attendance timestamp. A face-service failure ends this flow with an error and no attendance write.

Enrollment uses a separate active challenge: the manager starts an employee-bound
challenge, React streams camera frames, and Python checks straight/opposite
turns/return-to-center with liveness and consistent identity. After all four poses
pass, React submits only the challenge ID. Python consumes it and saves the initial
frontal embedding; Java then saves the active enrollment reference. Single-photo
enrollment can no longer skip the movement check.

## 5. Correction

`EmployeeDashboard.jsx` → POST `/corrections` → employee identity and request validation → `CorrectionService.create` saves PENDING.

Manager review → `CorrectionService.review` locks the employee and request → checks still PENDING and valid time order → stores decision/reviewer/time.

`AttendanceService.effective` starts with original scans and overlays approved corrections. `AttendanceMath` calculates paired minutes. That is why the report can change while original events remain intact.

## 6. Where each kind of code belongs

| Package | Responsibility |
|---|---|
| config | Spring-managed configuration, security and opt-in bootstrap |
| controller | HTTP routes, DTO validation and access checks |
| dto/request | Shape and basic validation of incoming JSON |
| dto/response | Safe response shape for frontend |
| service | Business rules and transactions |
| repository | Queries and row locks |
| entity | Explicit mapping to existing database columns |
| integration | HTTP calls to the separate face service |
| exception | Convert expected failures into HTTP responses |

For debugging, set breakpoints in `AuthController.login`, `EmployeeService.create`, `AttendanceService.record` and `CorrectionService.review`. Follow the variables from request DTO to repository call. Never log plaintext passwords, session cookies or face images.

## UI changes in this version

- `PasswordDialog.jsx`: shared password form, opened from the account dropdown.
- `SchedulePanel.jsx`: fixed shared schedule content displayed inside the manager sidebar layout.
- `FaceEnrollmentDialog.jsx`: employee-specific capture dialog; releases camera tracks on close and only reports success after the API succeeds.
- The former combined Setup page was removed. Old `/setup` bookmarks now open the schedule inside the manager layout.
