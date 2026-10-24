# US-CORR-01 — Submit time correction request

| Field | Value |
|-------|-------|
| **Feature** | Correction Request Submission |
| **Domain** | CORR |

> As an employee, I want to submit a correction request for a missed or incorrect check-in time, so that my attendance record can be corrected after manager approval.

## Acceptance Criteria

- AC1: Correction request form accessible from the "Requests" tab in Employee Dashboard
- AC2: Form fields: Work Date (date picker, required), Milestone (dropdown: MORNING_IN / LUNCH_OUT / AFTERNOON_IN / WORK_OUT, required), Proposed Time (time picker, required), Reason (text area, required, max 500 chars)
- AC3: Submit sends `POST /api/corrections` with JSON `{ workDate, eventType, requestedTime, reason }` plus session cookie and CSRF header
- AC4: Backend verifies `identity.employee()` and sets `requested_by_account_id` from the current session
- AC5: Validation: date must not be in the future
- AC6: Duplicate check: if a PENDING correction already exists for this employee + work date + event type, return `409 Conflict` with message "Request already pending for this milestone"
- AC7: On success: inserts into `correction_requests` with `status = PENDING`, returns the created object
- AC8: Frontend displays success message and refreshes the request list
- AC9: The proposed time is stored as `proposed_occurred_at` — it does not immediately affect attendance records (only after APPROVED)
