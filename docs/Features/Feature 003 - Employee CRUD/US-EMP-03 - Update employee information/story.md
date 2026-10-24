# US-EMP-03 — Update employee information

| Field | Value |
|-------|-------|
| **Feature** | Employee CRUD |
| **Domain** | EMP |

> As a manager, I want to update an employee's information, so that the records stay accurate when names change or corrections are needed.

## Acceptance Criteria

- AC1: Edit form accessible by selecting an employee from the list and clicking Edit
- AC2: Editable fields: Full Name (currently the only updatable field besides status)
- AC3: Submit sends `PATCH /api/employees/{id}` with JSON `{ fullName }` plus session cookie and CSRF header
- AC4: Backend verifies `identity.manager()` — only MANAGER role
- AC5: Backend loads employee by ID; if not found returns `404 Not Found`
- AC6: Updates the `full_name` column in `employees` table
- AC7: Returns updated `EmployeeResponse`
- AC8: Frontend refreshes the employee list after successful update
- AC9: Frontend UI has fields for department, phone, email, position — these are currently disabled with tooltip "pending DB approval" (see Feature 004 for enabling these fields)
