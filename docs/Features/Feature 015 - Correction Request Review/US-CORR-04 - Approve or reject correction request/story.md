# US-CORR-04 — Approve or reject correction request

| Field | Value |
|-------|-------|
| **Feature** | Correction Request Review |
| **Domain** | CORR |

> As a manager, I want to approve or reject a correction request with an optional note, so that the employee's attendance record is corrected or the request is declined with an explanation.

## Acceptance Criteria

- AC1: Each pending request row has "Approve" and "Reject" action buttons
- AC2: Approve sends `POST /api/corrections/{id}/review` with `{ approve: true, note }` plus session cookie and CSRF header
- AC3: Reject sends `POST /api/corrections/{id}/review` with `{ approve: false, note }` — note is recommended but optional for rejection
- AC4: Backend verifies `identity.manager()`
- AC5: Backend acquires pessimistic locks on employee and correction records (`lockById`) to prevent concurrent modifications
- AC6: On approve: validates milestone order after applying correction — calls `AttendanceMath.ordered()` with the proposed time merged into existing events. If order is invalid (e.g., MORNING_IN proposed at 14:00 would be after LUNCH_OUT), return `409 Conflict` with "Invalid milestone order"
- AC7: On approve success: updates `status = APPROVED`, `reviewed_by_account_id`, `reviewed_at = now()`, `review_note`
- AC8: On reject: updates `status = REJECTED`, same reviewer fields
- AC9: Only PENDING requests can be reviewed — reviewing a non-PENDING request returns `409 Conflict`
- AC10: Approved corrections take effect immediately — the `effective()` method in `AttendanceService` merges them when computing attendance data (original `attendance_events` are never modified)
