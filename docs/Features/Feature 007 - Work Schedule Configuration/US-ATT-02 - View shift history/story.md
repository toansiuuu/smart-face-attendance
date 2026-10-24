# US-ATT-02 — View shift history

| Field | Value |
|-------|-------|
| **Feature** | Work Schedule Configuration |
| **Domain** | ATT |

> As a manager, I want to see all schedule versions and their effective dates, so that I can track when working hours changed and which schedule applies to any given date.

## Acceptance Criteria

- AC1: Schedule list accessible from the "Schedule" tab in Admin Dashboard
- AC2: `GET /api/shifts` returns all shifts ordered by `effective_from DESC`, each with its 4 milestones
- AC3: Backend verifies `identity.manager()`
- AC4: Each schedule entry displays: Shift Code, Shift Name, Effective From date, and a table of 4 milestones with Window Start, Target Time, Window End
- AC5: The currently active schedule (applicable today) is visually highlighted
- AC6: Past schedules are shown but not editable — schedule history is immutable for audit integrity
