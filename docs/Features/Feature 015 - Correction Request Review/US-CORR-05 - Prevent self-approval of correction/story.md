# US-CORR-05 — Prevent self-approval of correction

| Field | Value |
|-------|-------|
| **Feature** | Correction Request Review |
| **Domain** | CORR |

> As the system, I want to prevent a manager from approving their own correction request, so that the review process maintains integrity and requires independent approval.

## Acceptance Criteria

- AC1: When a manager submits a correction request (managers can also be employees with attendance), the `requested_by_account_id` is their own account ID
- AC2: On review attempt: backend checks if `reviewed_by_account_id == requested_by_account_id`
- AC3: If the reviewer is the same as the requester, return `403 Forbidden` with message "Cannot approve your own correction request"
- AC4: This check applies to both approve and reject actions — a manager should not review their own requests at all
- AC5: Frontend should hide or disable the review buttons on requests where the current manager is the requester, but backend enforcement is the authoritative check
- AC6: In a single-manager system, the manager's own correction requests remain in PENDING status until another authorized user can review them (or the system is extended with additional manager accounts)
