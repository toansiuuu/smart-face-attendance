# US-CORR-02 — View own correction requests

| Field | Value |
|-------|-------|
| **Feature** | Correction Request Submission |
| **Domain** | CORR |

> As an employee, I want to view all my submitted correction requests and their statuses, so that I can track whether they have been approved or rejected.

## Acceptance Criteria

- AC1: Request list accessible from the "Requests" tab in Employee Dashboard
- AC2: `GET /api/corrections` with session cookie — backend filters by `identity.employee()` to show only the current employee's requests
- AC3: Table columns: Work Date, Milestone, Proposed Time, Reason, Status (PENDING / APPROVED / REJECTED), Submitted Date
- AC4: Status is color-coded: PENDING = yellow, APPROVED = green, REJECTED = red
- AC5: If REJECTED, show the manager's review note as a tooltip or expandable row
- AC6: Sorted by created_at DESC (newest first)
- AC7: Employee cannot edit or delete a request after submission — they can submit a new one for a different milestone or wait for the current one to be reviewed
