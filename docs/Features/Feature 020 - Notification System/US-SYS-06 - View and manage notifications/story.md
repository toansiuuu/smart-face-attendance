# US-SYS-06 — View and manage notifications

| Field | Value |
|-------|-------|
| **Feature** | Notification System |
| **Domain** | SYS |

> As a user (employee or manager), I want to see my notifications and mark them as read, so that I stay informed about events relevant to me.

## Acceptance Criteria

- AC1: Notification bell icon in the top navigation bar with unread count badge
- AC2: `GET /api/notifications?page={n}&size={n}` returns the current user's notifications (filtered by `recipient_account_id = identity.account().id`), sorted by `created_at` DESC
- AC3: `GET /api/notifications/unread-count` returns `{ count: N }` — used by the bell badge, polled every 60 seconds
- AC4: Notification dropdown panel shows the 10 most recent notifications with: title, message preview (truncated), time ago, read/unread indicator
- AC5: Clicking a notification: marks it as read (`PATCH /api/notifications/{id}/read`) and navigates to the referenced entity if `reference_type` and `reference_id` are set
- AC6: "Mark all as read" button: `PATCH /api/notifications/read-all` updates all unread notifications for the current user
- AC7: Notifications older than 90 days are eligible for cleanup via a scheduled job (but not automatically deleted in MVP)
- AC8: No email or push notifications in the initial implementation — in-app only
