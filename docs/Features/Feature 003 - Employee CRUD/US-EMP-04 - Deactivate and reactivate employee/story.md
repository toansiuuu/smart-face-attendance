# US-EMP-04 — Deactivate and reactivate employee

| Field | Value |
|-------|-------|
| **Feature** | Employee CRUD |
| **Domain** | EMP |

> As a manager, I want to deactivate an employee who has left the company and reactivate them if they return, so that only active employees can use the system.

## Acceptance Criteria

- AC1: Status toggle accessible from the employee edit form or employee list action
- AC2: Submit sends `PATCH /api/employees/{id}` with `{ status: "INACTIVE" }` or `{ status: "ACTIVE" }` plus session cookie and CSRF header
- AC3: Backend verifies `identity.manager()`
- AC4: When status changes to INACTIVE: the linked `user_accounts` record is also updated with `enabled = false`, preventing the employee from logging in
- AC5: When status changes back to ACTIVE: the linked `user_accounts` record is updated with `enabled = true`, restoring login access
- AC6: Deactivating an employee does NOT delete their attendance records, correction requests, or face enrollment — data is preserved for historical reporting
- AC7: An inactive employee cannot be scanned for attendance — the face recognition flow should reject scans for inactive employees
- AC8: Frontend shows visual distinction for inactive employees (greyed out row or badge)
