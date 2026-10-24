# US-SYS-07 — Record audit trail for data changes

| Field | Value |
|-------|-------|
| **Feature** | Audit Logging |
| **Domain** | SYS |

> As a system administrator, I want all significant data changes to be automatically recorded in an audit log, so that I can trace who changed what and when for compliance and debugging purposes.

## Acceptance Criteria

- AC1: New `audit_logs` table: `id` (BIGINT PK AUTO_INCREMENT), `action` (ENUM: CREATE, UPDATE, DELETE, LOGIN, LOGOUT), `entity_type` (VARCHAR 100), `entity_id` (BIGINT), `actor_account_id` (BIGINT FK → user_accounts, nullable for system actions), `old_values` (JSON, nullable), `new_values` (JSON, nullable), `ip_address` (VARCHAR 45), `created_at` (TIMESTAMP, indexed)
- AC2: Audited entities: `employees`, `user_accounts`, `shifts`, `shift_milestones`, `attendance_events`, `correction_requests`, `face_enrollments`
- AC3: Implementation via JPA `@EntityListeners(AuditListener.class)` — automatically captures pre/post state on persist, update, and remove
- AC4: `old_values` and `new_values` store only changed fields as JSON (not the entire entity) to minimize storage
- AC5: Authentication events (login success, login failure, logout) recorded by `AuthController` with `entity_type = "SESSION"`
- AC6: `actor_account_id` is resolved from the current SecurityContext. For unauthenticated actions (e.g., kiosk scan via `POST /api/diem-danh`), actor is null and `ip_address` identifies the source
- AC7: Audit records are immutable — no UPDATE or DELETE operations allowed on the `audit_logs` table (enforced by excluding the entity from JPA cascades and providing no repository write methods)
- AC8: Retention policy: audit logs are kept for 1 year. A scheduled monthly job archives logs older than 1 year to a compressed file before deletion
