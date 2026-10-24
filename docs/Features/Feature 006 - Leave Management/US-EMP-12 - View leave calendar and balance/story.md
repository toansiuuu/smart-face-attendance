# US-EMP-12 — View leave calendar and balance

| Field | Value |
|-------|-------|
| **Feature** | Leave Management |
| **Domain** | EMP |

> As an employee, I want to see a calendar view of my leave days and remaining balance, so that I can plan my time off.

## Acceptance Criteria

- AC1: Leave calendar accessible from Employee Dashboard under the "Leave" tab
- AC2: Calendar view shows approved leave days highlighted in a distinct color, pending leave in a lighter shade
- AC3: Leave balance summary at the top: total annual leave allowance, used days, remaining days (configurable per company policy, default 12 days/year)
- AC4: Sick leave and personal leave counted separately (no annual limit, but tracked)
- AC5: Manager view: `GET /api/leave-requests?employeeId={id}` or all employees — shows team leave calendar for capacity planning
- AC6: Month navigation: previous/next month buttons to browse leave history
- AC7: Click on a leave entry shows details: type, reason, approval status, approved by whom
