# US-SYS-05 — Send in-app notifications

| Field | Value |
|-------|-------|
| **Feature** | Notification System |
| **Domain** | SYS |

> As the system, I want to generate notifications for important events, so that users are informed without needing to constantly check different pages.

## Acceptance Criteria

- AC1: New `notifications` table: `id` (BIGINT PK), `recipient_account_id` (FK → user_accounts), `type` (ENUM: CORRECTION_REVIEWED, LEAVE_UPDATED, SHIFT_CHANGED, ANNOUNCEMENT), `title` (VARCHAR 200), `message` (TEXT), `reference_type` (VARCHAR 50), `reference_id` (BIGINT), `is_read` (BOOLEAN default false), `created_at` (TIMESTAMP)
- AC2: `NotificationService.send(recipientId, type, title, message, refType, refId)` creates a notification record
- AC3: Triggered events:
  - Correction request approved/rejected → notify the requesting employee
  - Leave request approved/rejected → notify the requesting employee (when Feature 006 is implemented)
  - New correction request submitted → notify all managers
  - Shift configuration changed → notify all active employees
- AC4: Notifications are created within the same transaction as the triggering action (e.g., correction review) to ensure consistency
- AC5: `reference_type` and `reference_id` enable deep-linking: clicking a notification navigates to the related entity (e.g., correction request detail)
- AC6: Batch notification support: `NotificationService.broadcast(type, title, message)` sends to all active user accounts
