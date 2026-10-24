# US-EMP-02 — View employee list with search and pagination

| Field | Value |
|-------|-------|
| **Feature** | Employee CRUD |
| **Domain** | EMP |

> As a manager, I want to view all employees with search and pagination, so that I can quickly find and manage employee records.

## Acceptance Criteria

- AC1: Employee list accessible from the Employee tab in Admin Dashboard
- AC2: `GET /api/employees?search={text}&page={n}&size={n}` with session cookie
- AC3: Backend verifies `identity.manager()` — only MANAGER role
- AC4: Search filter: case-insensitive match against `employeeCode` and `fullName` (SQL LIKE)
- AC5: Pagination: default page = 0, default size = 20. Returns paginated results with total count
- AC6: Each row displays: Employee Code, Full Name, Status (ACTIVE/INACTIVE), Face Enrolled (yes/no icon)
- AC7: Face enrollment status derived from `FaceEnrollmentRepository.findByEmployeeId()` — `hasFaceData: true` if a record exists
- AC8: Table supports sorting by employee code or name (frontend sorting on current page data)
- AC9: Empty state: show message when no employees match the search criteria
