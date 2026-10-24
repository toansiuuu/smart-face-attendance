# US-AUTH-02 — Logout and invalidate session

| Field | Value |
|-------|-------|
| **Feature** | Session Login and Logout |
| **Domain** | AUTH |

> As a logged-in user, I want to log out, so that my session is terminated and no one else can use my browser session.

## Acceptance Criteria

- AC1: Logout button visible on the sidebar/header for all authenticated users
- AC2: Click sends `POST /api/auth/logout` with session cookie and CSRF header
- AC3: Backend invalidates `HttpSession` and clears `SecurityContext`
- AC4: Backend returns `200 OK`
- AC5: Frontend clears all local state (user info, CSRF token)
- AC6: Frontend navigates to `/login`
- AC7: After logout, accessing any protected route redirects to `/login` (session no longer valid on the server)
