# US-ATT-13 — Auto-exclude holidays from attendance

| Field | Value |
|-------|-------|
| **Feature** | Holiday Management |
| **Domain** | ATT |

> As the system, I want to automatically skip holidays when computing attendance, so that employees are not marked absent on official days off.

## Acceptance Criteria

- AC1: `AttendanceService.report()` checks if each date in the range is a holiday (via `HolidayRepository.existsByDate(date)`)
- AC2: If a date is a holiday, the day status is "Holiday" instead of "Absent" — no attendance events are expected
- AC3: Holidays are also excluded from daily summary computation (Feature 012) — they do not count toward absent totals
- AC4: The holiday check considers both exact-date entries and resolved recurring entries for the current year
- AC5: If an employee scans attendance on a holiday, the scan is accepted but the day is still marked as "Holiday" (no tardiness penalty)
- AC6: Holiday exclusion applies equally to all employees — no per-department holiday differentiation in this phase
- AC7: Monthly attendance totals (working days, present days) exclude holidays from the denominator
