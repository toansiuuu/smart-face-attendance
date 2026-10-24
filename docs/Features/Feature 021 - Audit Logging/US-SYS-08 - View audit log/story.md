# US-SYS-08 — View audit log

| Field | Value |
|-------|-------|
| **Feature** | Audit Logging |
| **Domain** | SYS |

> As a manager, I want to search and view the audit log, so that I can investigate specific changes or review activity for a particular employee or time period.

## Acceptance Criteria

- AC1: Audit log page accessible from Admin Dashboard — "Audit Log" menu item, requires MANAGER role
- AC2: `GET /api/audit-logs?page={n}&size={n}&entityType={type}&entityId={id}&actorId={id}&action={action}&from={datetime}&to={datetime}` — all filters optional
- AC3: Table columns: Timestamp, Action, Entity Type, Entity ID, Actor (account name), Changes Summary
- AC4: "Changes Summary" shows a human-readable diff: "Changed `full_name` from 'Nguyen Van A' to 'Nguyen Van B'" — derived from `old_values` and `new_values` JSON
- AC5: Expandable row detail shows the full `old_values` and `new_values` JSON for technical inspection
- AC6: Filters: date range picker, entity type dropdown, action type dropdown, actor search (autocomplete on account name)
- AC7: Sorted by `created_at` DESC (most recent first)
- AC8: Export audit log to CSV for compliance reporting — filtered results only
