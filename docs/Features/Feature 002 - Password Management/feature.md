# Feature 002 — Password Management

| Field | Value |
|-------|-------|
| **Domain** | AUTH |
| **Status** | Implemented |

## Description

Password lifecycle management including changing passwords and auto-generating initial passwords for newly created employees.

## Implementation Status

Change password is implemented via `POST /api/auth/password`. Validates current password, enforces minimum 12 characters and maximum 72 UTF-8 bytes (BCrypt limit). Passwords are stored as BCrypt hashes. On successful change, session is invalidated forcing re-login. Auto-generated passwords are created from employee name initials during employee creation in `EmployeeService.create()`.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-AUTH-03 | Change own password | [story](US-AUTH-03%20-%20Change%20own%20password/story.md) |
| US-AUTH-04 | Auto-generate initial password on employee creation | [story](US-AUTH-04%20-%20Auto-generate%20initial%20password%20on%20employee%20creation/story.md) |
