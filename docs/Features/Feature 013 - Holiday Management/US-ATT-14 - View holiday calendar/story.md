# US-ATT-14 — View holiday calendar

| Field | Value |
|-------|-------|
| **Feature** | Holiday Management |
| **Domain** | ATT |

> As an employee or manager, I want to see the holiday calendar for the year, so that I can plan around official days off.

## Acceptance Criteria

- AC1: Holiday calendar accessible from both Employee Dashboard and Admin Dashboard
- AC2: Calendar view shows all holidays for the selected year with holiday names
- AC3: `GET /api/holidays?year={year}` — accessible by both EMPLOYEE and MANAGER roles
- AC4: Recurring holidays are resolved for the requested year and displayed alongside one-time holidays
- AC5: Current month is highlighted, upcoming holidays are visually distinguished from past ones
- AC6: List view alternative: a simple table listing all holidays sorted by date with name and type (one-time / recurring)
- AC7: Year navigation: previous/next year buttons
