# US-EMP-07 — Create and manage departments

| Field | Value |
|-------|-------|
| **Feature** | Department Management |
| **Domain** | EMP |

> As a manager, I want to create, edit, and delete departments, so that the organizational structure is reflected in the system.

## Acceptance Criteria

- AC1: Department management accessible from a new "Departments" tab in Admin Dashboard
- AC2: Create department: `POST /api/departments` with `{ name, description, managerId }`. Name is required, unique, max 100 chars. Description optional, max 500 chars. Manager ID optional (FK to `employees`)
- AC3: Edit department: `PATCH /api/departments/{id}` — update name, description, or manager assignment
- AC4: Delete department: `DELETE /api/departments/{id}` — only allowed if no employees are currently assigned to the department; otherwise return `409 Conflict` with message
- AC5: List departments: `GET /api/departments` — returns all departments with employee count per department
- AC6: Database: new `departments` table with columns `id BIGINT PK AUTO_INCREMENT`, `name VARCHAR(100) UNIQUE`, `description VARCHAR(500)`, `manager_id BIGINT FK NULLABLE`, `created_at DATETIME`
- AC7: All endpoints require `identity.manager()` verification
- AC8: Department manager shown as a link to the employee detail in the UI
