# US-AUTH-01 — Login with username and password

| Field | Value |
|-------|-------|
| **Feature** | Session Login and Logout |
| **Domain** | AUTH |

> As a user (employee or manager), I want to log in with my username and password, so that I can access the system features corresponding to my role.

## Acceptance Criteria

- AC1: Login page at `/login`. Unauthenticated access to any other route redirects here
- AC2: Username field: required, trimmed before submission
- AC3: Password field: required, masked input
- AC4: Before submitting login, frontend fetches CSRF token via `GET /api/auth/csrf` and stores the returned `token` value. All subsequent state-changing requests include `X-CSRF-TOKEN` header
- AC5: Submit sends `POST /api/auth/login` with JSON body `{ username, password }` plus CSRF header
- AC6: Backend looks up `user_accounts` by username (case-sensitive). If not found or `enabled = false`, returns `401 Unauthorized`
- AC7: Password verified via `BCrypt.matches(plaintext, passwordHash)`. On mismatch returns `401 Unauthorized`
- AC8: On success: old session invalidated (prevent session fixation), new session created, `SecurityContext` saved to `HttpSession`. Response returns `{ name, role, employeeId }`
- AC9: Frontend resets CSRF token to null after successful login (forces re-fetch on next state-changing request)
- AC10: Role-based redirect: `MANAGER` navigates to `/admin`, `EMPLOYEE` navigates to `/employee`
- AC11: Submit button disabled while request is in-flight to prevent double-submit
- AC12: On 401: display error message without clearing the form fields
