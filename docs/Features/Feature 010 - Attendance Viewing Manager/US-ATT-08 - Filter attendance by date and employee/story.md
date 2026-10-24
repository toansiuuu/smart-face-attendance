# US-ATT-08 — Filter attendance by date and employee

| Field | Value |
|-------|-------|
| **Feature** | Attendance Viewing (Manager) |
| **Domain** | ATT |

> As a manager, I want to filter attendance records by date range and employee name, so that I can focus on specific time periods or find a particular employee's records.

## Acceptance Criteria

- AC1: Date range picker: from date and to date inputs above the attendance table
- AC2: Search field: text input that filters by employee code or full name
- AC3: Filters are passed as query parameters: `GET /api/attendance?from={date}&to={date}&search={text}&page=0&size=20`
- AC4: Search is case-insensitive and matches partial strings against both `employeeCode` and `fullName`
- AC5: Changing any filter resets pagination to page 0
- AC6: Date range validation: from date must be <= to date, maximum range 3 months to prevent performance issues
- AC7: Clear filters button resets to default: current month, no search text
- AC8: Filter state is preserved in URL query parameters for bookmarking and sharing
