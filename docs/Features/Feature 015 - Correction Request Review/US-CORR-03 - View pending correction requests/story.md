# US-CORR-03 — View pending correction requests

| Field | Value |
|-------|-------|
| **Feature** | Correction Request Review |
| **Domain** | CORR |

> As a manager, I want to see all pending correction requests, so that I can review and act on them in a timely manner.

## Acceptance Criteria

- AC1: Pending requests listed in Admin Dashboard under the "Requests" tab
- AC2: `GET /api/corrections?page={n}&size={n}` with session cookie — requires `identity.manager()`
- AC3: Default filter: PENDING status only. Optional filter to include APPROVED/REJECTED for history
- AC4: Table columns: Employee Name, Employee Code, Work Date, Milestone, Proposed Time, Reason, Submitted Date
- AC5: Sorted by created_at ASC (oldest pending requests first — FIFO processing)
- AC6: Badge/counter on the Requests tab showing the number of pending requests
- AC7: Pagination controls for large request volumes
