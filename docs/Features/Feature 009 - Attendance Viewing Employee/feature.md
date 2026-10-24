# Feature 009 — Attendance Viewing (Employee)

| Field | Value |
|-------|-------|
| **Domain** | ATT |
| **Status** | Implemented |

## Description

Personal attendance view for employees, showing their own monthly attendance records with 4 milestones per day, status (On Time / Late / Absent), and total worked minutes.

## Implementation Status

Implemented via `GET /api/attendance?from=&to=&employeeId=` with `identity.employee()` verification. Backend enforces that the `employeeId` matches the current account's linked employee — employees can only view their own data (returns 403 on mismatch). The `AttendanceService.report()` method computes daily summaries using `effective()` (raw events merged with APPROVED corrections) and `day()` (status calculation). Worked minutes computed by `AttendanceMath.workedMinutes()` = (LUNCH_OUT - MORNING_IN) + (WORK_OUT - AFTERNOON_IN).

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-ATT-05 | View personal monthly attendance | [story](US-ATT-05%20-%20View%20personal%20monthly%20attendance/story.md) |
| US-ATT-06 | View attendance status per milestone | [story](US-ATT-06%20-%20View%20attendance%20status%20per%20milestone/story.md) |
