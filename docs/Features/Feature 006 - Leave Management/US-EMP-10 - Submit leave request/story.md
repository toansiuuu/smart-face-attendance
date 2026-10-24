# US-EMP-10 — Submit leave request

| Field | Value |
|-------|-------|
| **Feature** | Leave Management |
| **Domain** | EMP |

> As an employee, I want to submit a leave request specifying the type, dates, and reason, so that my absence is pre-approved and not counted as unexcused.

## Acceptance Criteria

- AC1: Leave request form accessible from Employee Dashboard under a "Leave" tab
- AC2: Form fields: leave type (dropdown: ANNUAL, SICK, PERSONAL, OTHER), start date (required), end date (required, must be >= start date), reason (required, max 500 chars)
- AC3: Submit sends `POST /api/leave-requests` with JSON body plus session cookie and CSRF header
- AC4: Backend verifies `identity.employee()` and sets `employee_id` from current account
- AC5: Validation: start date must not be in the past (except SICK leave which can be submitted retroactively for up to 3 days)
- AC6: Validation: no overlapping PENDING or APPROVED leave request for the same date range
- AC7: On success: inserts into `leave_requests` with `status = PENDING`, `created_at = now()`
- AC8: Database: `leave_requests` table with columns `id BIGINT PK`, `employee_id BIGINT FK`, `leave_type ENUM`, `start_date DATE`, `end_date DATE`, `reason TEXT`, `status ENUM('PENDING','APPROVED','REJECTED')`, `approved_by BIGINT FK NULLABLE`, `created_at DATETIME`
- AC9: Employee can view their own submitted requests with status (PENDING/APPROVED/REJECTED)
- AC10: Employee can cancel a PENDING request (status changes to CANCELLED)
