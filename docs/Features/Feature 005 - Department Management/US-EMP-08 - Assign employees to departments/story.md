# US-EMP-08 — Assign employees to departments

| Field | Value |
|-------|-------|
| **Feature** | Department Management |
| **Domain** | EMP |

> As a manager, I want to assign employees to departments, so that employees are organized by team for reporting and management.

## Acceptance Criteria

- AC1: Department assignment accessible from the employee edit form as a dropdown select
- AC2: Dropdown lists all departments from `GET /api/departments`
- AC3: Assignment sends `PATCH /api/employees/{id}` with `{ departmentId }` — updates the `department_id` FK on the `employees` table
- AC4: An employee can belong to at most one department at a time
- AC5: Setting `departmentId = null` removes the employee from their current department
- AC6: Bulk assignment: manager can select multiple employees from the employee list and assign them all to the same department in one action
- AC7: Backend verifies `identity.manager()` for all operations
- AC8: When an employee is assigned to a new department, no historical attendance data is affected — department is a current-state attribute
