# US-ATT-04 — Determine milestone type from scan time

| Field | Value |
|-------|-------|
| **Feature** | Attendance Recording |
| **Domain** | ATT |

> As the system, I want to automatically determine which milestone (MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT) a scan corresponds to based on the current time, so that attendance events are categorized correctly.

## Acceptance Criteria

- AC1: `AttendanceService.record()` loads the applicable shift via `ShiftService.applicable(today)`
- AC2: If no shift is configured for the current date, return error — no attendance can be recorded
- AC3: The scan time is compared against each milestone's `[windowStart, windowEnd]` range
- AC4: If the scan time falls within a milestone's window, that milestone type is assigned to the event
- AC5: If the scan time does not fall within any window, the system either rejects the scan or assigns the nearest milestone (current implementation: uses `explicitType` parameter if provided, otherwise auto-determines)
- AC6: Duplicate check: if an event already exists for this employee + work_date + event_type, return `409 Conflict` — each milestone can only be recorded once per day
- AC7: Milestone ordering: if recording LUNCH_OUT, a MORNING_IN event must already exist for that day. Enforced by `AttendanceMath.ordered()` check
- AC8: The event is stored in `attendance_events` with `employee_id`, `shift_id`, `work_date`, `event_type`, `occurred_at`, `created_at`
- AC9: Status calculation: if `occurred_at > milestone.targetTime`, the employee is "Late" for that milestone; within grace minutes is "On Time"
