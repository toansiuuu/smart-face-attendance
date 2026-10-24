# US-ATT-11 — View daily summary on dashboard

| Field | Value |
|-------|-------|
| **Feature** | Daily Attendance Summary |
| **Domain** | ATT |

> As a manager, I want to see today's attendance summary at a glance on the dashboard, so that I know how many employees are present, late, or absent without checking individual records.

## Acceptance Criteria

- AC1: Dashboard widget on Admin Dashboard home page showing today's summary
- AC2: Widget displays: Total Employees, Present count (with percentage), Late count, Absent count, On Leave count
- AC3: `GET /api/attendance/summary?date={today}` returns the pre-computed summary for the given date
- AC4: If no summary exists yet for today (day not ended), compute a real-time snapshot from current events
- AC5: Each count is clickable — navigates to the attendance table pre-filtered to show only employees in that status
- AC6: Color coding: Present = green, Late = yellow/orange, Absent = red, On Leave = blue
- AC7: Historical summary: date picker allows viewing any past date's summary
