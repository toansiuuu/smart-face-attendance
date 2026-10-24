# Feature 015 — Correction Request Review

| Field | Value |
|-------|-------|
| **Domain** | CORR |
| **Status** | Implemented |

## Description

Manager workflow to review, approve, or reject employee correction requests. Includes self-approval prevention and milestone order validation to ensure approved corrections maintain data integrity.

## Implementation Status

Implemented in `CorrectionService.review()` via `POST /api/corrections/{id}/review`. Self-approval prevention: `reviewer != requester` check returns 403. Milestone order validation: after applying the proposed correction, `AttendanceMath.ordered()` verifies that milestones remain in valid order (MORNING_IN < LUNCH_OUT < AFTERNOON_IN < WORK_OUT) — if not, returns 409. Uses pessimistic locking (`lockById`) on both employee and correction records to prevent race conditions. On approval: updates `status = APPROVED`, `reviewed_by`, `reviewed_at`, `review_note`.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-CORR-03 | View pending correction requests | [story](US-CORR-03%20-%20View%20pending%20correction%20requests/story.md) |
| US-CORR-04 | Approve or reject correction request | [story](US-CORR-04%20-%20Approve%20or%20reject%20correction%20request/story.md) |
| US-CORR-05 | Prevent self-approval of correction | [story](US-CORR-05%20-%20Prevent%20self-approval%20of%20correction/story.md) |
