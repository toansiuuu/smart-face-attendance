# US-ATT-07 — View all employees attendance records

| Field | Value |
|-------|-------|
| **Feature** | Attendance Viewing (Manager) |
| **Domain** | ATT |

> As a manager, I want to view attendance records for all employees, so that I can monitor overall attendance and identify issues like chronic lateness or absenteeism.

## Acceptance Criteria

- AC1: Attendance tab in Admin Dashboard shows a table of all employees' attendance
- AC2: `GET /api/attendance?from={date}&to={date}&page={n}&size={n}` with session cookie
- AC3: Backend verifies `identity.manager()`
- AC4: For each employee in the current page, backend calls `AttendanceService.report()` to compute daily summaries
- AC5: Each row includes raw events merged with APPROVED corrections via `effective()` method
- AC6: Table columns: Employee Code, Full Name, Date, MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT, Status, Minutes Worked
- AC7: Pagination controls at the bottom: page size selector and page navigation
- AC8: Default view: current month, all employees, page size 20
