# US-ATT-05 — View personal monthly attendance

| Field | Value |
|-------|-------|
| **Feature** | Attendance Viewing (Employee) |
| **Domain** | ATT |

> As an employee, I want to view my monthly attendance records, so that I can track my check-in/check-out times and identify any missing entries.

## Acceptance Criteria

- AC1: Attendance tab accessible from Employee Dashboard
- AC2: Month selector: defaults to current month, allows navigation to previous months
- AC3: `GET /api/attendance?from={firstDayOfMonth}&to={lastDayOfMonth}&employeeId={myId}` with session cookie
- AC4: Backend verifies `identity.employee()` and confirms `employeeId` matches current account's linked employee. Mismatch returns `403 Forbidden`
- AC5: Data combines raw `attendance_events` with APPROVED `correction_requests` via `effective()` method — corrections override raw times
- AC6: Table columns: Date, MORNING_IN time, LUNCH_OUT time, AFTERNOON_IN time, WORK_OUT time, Status, Minutes Worked
- AC7: Each cell shows the actual `occurred_at` time for that milestone, or empty if not recorded
- AC8: Minutes Worked = (LUNCH_OUT - MORNING_IN) + (WORK_OUT - AFTERNOON_IN), computed by `AttendanceMath.workedMinutes()`
- AC9: Days with no attendance events at all show as "Absent" (all cells empty except date)
- AC10: Weekend days (Saturday, Sunday) are visually distinguished and not counted as absent
