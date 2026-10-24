# US-AUTH-03 — Change own password

| Field | Value |
|-------|-------|
| **Feature** | Password Management |
| **Domain** | AUTH |

> As a logged-in user, I want to change my password, so that I can secure my account or replace the auto-generated initial password.

## Acceptance Criteria

- AC1: Change password dialog accessible from the user menu/settings area
- AC2: Form fields: current password (required), new password (required), confirm new password (required)
- AC3: Frontend validation: new password minimum 12 characters, confirmation must match new password
- AC4: Submit sends `POST /api/auth/password` with JSON `{ currentPassword, newPassword }` plus session cookie and CSRF header
- AC5: Backend retrieves current account via `identity.current()`, then verifies `BCrypt.matches(currentPassword, account.passwordHash)`
- AC6: If current password is wrong: return `401 Unauthorized`, frontend displays error
- AC7: Backend validates new password: minimum 12 characters, maximum 72 UTF-8 bytes (BCrypt limit) via `checkPassword()` method
- AC8: New password stored as BCrypt hash: `encoder.encode(newPassword)`
- AC9: After successful change: session is invalidated, forcing the user to log in again with the new password
- AC10: Frontend redirects to `/login` with a success message: password changed, please log in again
