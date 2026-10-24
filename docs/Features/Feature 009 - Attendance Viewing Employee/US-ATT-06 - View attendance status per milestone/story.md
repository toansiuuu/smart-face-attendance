# US-ATT-06 — View attendance status per milestone

| Field | Value |
|-------|-------|
| **Feature** | Attendance Viewing (Employee) |
| **Domain** | ATT |

> As an employee, I want to see whether each check-in was on time or late, so that I can understand my punctuality and improve if needed.

## Acceptance Criteria

- AC1: Each milestone cell in the attendance table shows a status indicator: green (On Time), yellow (Late within grace), red (Late beyond grace), or empty (not recorded)
- AC2: Status is calculated by comparing `occurred_at` with the milestone's `targetTime` from the applicable shift
- AC3: Grace minutes: if `occurred_at - targetTime <= graceMinutes`, status is "On Time". Grace minutes are configured in the system health/policy settings
- AC4: If `occurred_at > targetTime + graceMinutes`, status is "Late" — the cell shows both the time and "Late" label
- AC5: For MORNING_IN and AFTERNOON_IN: late = arrived after target. For LUNCH_OUT and WORK_OUT: late = left before target (early departure)
- AC6: Daily overall status is the worst status across all 4 milestones: if any milestone is Late, the day is "Late"; if any milestone is missing, the day is "Incomplete"
- AC7: Summary row at bottom of month: total days present, total days late, total days absent, total minutes worked
