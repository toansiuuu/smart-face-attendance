# Feature 014 — Correction Request Submission

| Field | Value |
|-------|-------|
| **Domain** | CORR |
| **Status** | Implemented |

## Description

Allows employees to submit time correction requests when they missed a scan or the recorded time is incorrect. Each request targets a specific date, milestone, and proposed time with a reason.

## Implementation Status

Implemented in `CorrectionService.create()` via `POST /api/corrections`. Validates: no duplicate PENDING request for the same employee + date + event type, date must be valid. Creates a `correction_requests` record with `status = PENDING`, `requested_by_account_id` from current session. Employees can view their own requests. The correction is "soft" — original `attendance_events` are never modified. Instead, `effective()` merges APPROVED corrections when computing attendance data.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-CORR-01 | Submit time correction request | [story](US-CORR-01%20-%20Submit%20time%20correction%20request/story.md) |
| US-CORR-02 | View own correction requests | [story](US-CORR-02%20-%20View%20own%20correction%20requests/story.md) |
