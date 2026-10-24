# US-EMP-11 — Approve or reject leave request

| Field | Value |
|-------|-------|
| **Feature** | Leave Management |
| **Domain** | EMP |

> As a manager, I want to approve or reject employee leave requests, so that I can manage team availability and ensure adequate staffing.

## Acceptance Criteria

- AC1: Pending leave requests listed in Admin Dashboard under a "Leave Requests" tab
- AC2: List endpoint: `GET /api/leave-requests?status=PENDING&page={n}&size={n}` — requires `identity.manager()`
- AC3: Each request shows: employee name, leave type, date range, reason, submitted date
- AC4: Approve action: `POST /api/leave-requests/{id}/review` with `{ approved: true }` — sets `status = APPROVED`, `approved_by = current account ID`
- AC5: Reject action: `POST /api/leave-requests/{id}/review` with `{ approved: false, note }` — sets `status = REJECTED`, note stored for employee to see
- AC6: Only PENDING requests can be reviewed; reviewing an already-reviewed request returns `409 Conflict`
- AC7: Approved leave dates are excluded from attendance calculations — `AttendanceService.report()` should mark days covered by approved leave as "On Leave" instead of "Absent"
- AC8: Manager cannot approve their own leave request (same self-approval prevention logic as correction requests)
