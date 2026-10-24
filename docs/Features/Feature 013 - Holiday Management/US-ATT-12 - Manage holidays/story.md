# US-ATT-12 — Manage holidays

| Field | Value |
|-------|-------|
| **Feature** | Holiday Management |
| **Domain** | ATT |

> As a manager, I want to add, edit, and remove official holidays, so that the system correctly excludes those days from attendance tracking.

## Acceptance Criteria

- AC1: Holiday management accessible from a "Holidays" section in Admin Dashboard
- AC2: Create holiday: `POST /api/holidays` with `{ date, name, isRecurring }`. Date is required (format YYYY-MM-DD), name required (max 100 chars), isRecurring boolean (default false)
- AC3: Edit holiday: `PATCH /api/holidays/{id}` — update name, date, or recurring flag
- AC4: Delete holiday: `DELETE /api/holidays/{id}` — allowed even if the date has passed (cleanup)
- AC5: List holidays: `GET /api/holidays?year={year}` — returns all holidays for the given year, including resolved recurring holidays
- AC6: Recurring holidays: when `isRecurring = true`, the holiday repeats on the same month-day every year (e.g., January 1st, September 2nd for Vietnam National Day)
- AC7: Database: `holidays` table with `id BIGINT PK`, `holiday_date DATE`, `name VARCHAR(100)`, `is_recurring BOOLEAN`, `created_at DATETIME`. Unique constraint on `holiday_date`
- AC8: All endpoints require `identity.manager()`
- AC9: Bulk import: manager can upload a list of holidays (CSV or manual multi-add form) for the year
