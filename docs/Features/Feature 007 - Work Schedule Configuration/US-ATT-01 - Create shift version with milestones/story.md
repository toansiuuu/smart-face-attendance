# US-ATT-01 — Create shift version with milestones

| Field | Value |
|-------|-------|
| **Feature** | Work Schedule Configuration |
| **Domain** | ATT |

> As a manager, I want to create a new work schedule version with 4 daily milestones, so that the system knows when employees should check in and out.

## Acceptance Criteria

- AC1: Schedule configuration accessible from the "Schedule" tab in Admin Dashboard
- AC2: Form fields: Shift Code (unique), Shift Name, Effective From (date), and 4 milestone blocks — each with Window Start (time), Target Time (time), Window End (time)
- AC3: The 4 milestones are fixed types: `MORNING_IN`, `LUNCH_OUT`, `AFTERNOON_IN`, `WORK_OUT`
- AC4: Submit sends `POST /api/shifts` with JSON `{ shiftCode, shiftName, effectiveFrom, milestones[4] }` plus session cookie and CSRF header
- AC5: Backend verifies `identity.manager()`
- AC6: Validation: exactly 4 milestones, one per type
- AC7: Validation: for each milestone, `windowStart <= targetTime <= windowEnd`
- AC8: Validation: windows must not overlap between milestones
- AC9: Validation: milestone order must be `MORNING_IN < LUNCH_OUT < AFTERNOON_IN < WORK_OUT` (based on target times)
- AC10: Validation: if this is not the first schedule version, `effectiveFrom` must be in the future
- AC11: On success: inserts into `shifts` table and 4 rows into `shift_milestones` table
- AC12: Database constraints: `shifts` has UNIQUE on `shift_code` and UNIQUE on `effective_from`
