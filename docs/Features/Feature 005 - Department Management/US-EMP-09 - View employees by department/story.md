# US-EMP-09 — View employees by department

| Field | Value |
|-------|-------|
| **Feature** | Department Management |
| **Domain** | EMP |

> As a manager, I want to filter and view employees grouped by department, so that I can manage teams effectively and see department-level headcounts.

## Acceptance Criteria

- AC1: Department filter added to the employee list: `GET /api/employees?departmentId={id}&search={text}&page={n}&size={n}`
- AC2: Dropdown filter shows all departments plus an "All Departments" option and an "Unassigned" option
- AC3: "Unassigned" filters employees where `department_id IS NULL`
- AC4: Employee list table includes a "Department" column showing the department name
- AC5: Department tab/page shows a summary card per department: department name, employee count, manager name
- AC6: Clicking a department card navigates to the employee list pre-filtered by that department
- AC7: Backend verifies `identity.manager()` for all queries
