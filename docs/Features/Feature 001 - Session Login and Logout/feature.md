# Feature 001 — Session Login and Logout

| Field | Value |
|-------|-------|
| **Domain** | AUTH |
| **Status** | Implemented |

## Description

Session-based authentication allowing users to log in with username and password, and log out to invalidate the session. Includes CSRF protection on all state-changing requests.

## Implementation Status

Login is fully implemented via `POST /api/auth/login` with BCrypt password verification, session creation with fixation protection, and CSRF token management via `GET /api/auth/csrf`. Logout invalidates the session via `POST /api/auth/logout`. Frontend stores CSRF token in memory and attaches it as `X-CSRF-TOKEN` header on every request. Role-based redirect after login: MANAGER to `/admin`, EMPLOYEE to `/employee`. The `GET /api/auth/me` endpoint returns the current user's identity.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-AUTH-01 | Login with username and password | [story](US-AUTH-01%20-%20Login%20with%20username%20and%20password/story.md) |
| US-AUTH-02 | Logout and invalidate session | [story](US-AUTH-02%20-%20Logout%20and%20invalidate%20session/story.md) |
