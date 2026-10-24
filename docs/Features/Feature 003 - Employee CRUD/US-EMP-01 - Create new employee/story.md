# US-EMP-01 — Create new employee

| Field | Value |
|-------|-------|
| **Feature** | Employee CRUD |
| **Domain** | EMP |

> As a manager, I want to create a new employee record, so that the employee exists in the system and can be enrolled for face attendance.

## Acceptance Criteria

- AC1: Create form accessible from Employee tab in Admin Dashboard
- AC2: Required fields: Employee Code (unique, trimmed), Full Name (trimmed)
- AC3: Submit sends `POST /api/employees` with JSON `{ employeeCode, fullName }` plus session cookie and CSRF header
- AC4: Backend verifies `identity.manager()` — only MANAGER role can create employees
- AC5: Backend validates input: employee code must not already exist in `employees` table
- AC6: On success: inserts into `employees` table with `status = ACTIVE`, `created_at = now()`
- AC7: Automatically creates a `user_accounts` record (see US-AUTH-04): username = employeeCode, password auto-generated from fullName, role = EMPLOYEE, enabled = true
- AC8: Returns `EmployeeResponse` with `id, employeeCode, fullName, status, hasFaceData: false`
- AC9: Frontend refreshes the employee list after successful creation
- AC10: On duplicate employee code: return `409 Conflict`, display error message
