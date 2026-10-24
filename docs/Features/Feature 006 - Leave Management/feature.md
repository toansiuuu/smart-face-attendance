# Feature 006 — Leave Management

| Field | Value |
|-------|-------|
| **Domain** | EMP |
| **Status** | Not Started |

## Description

Leave request workflow allowing employees to submit leave requests (annual, sick, personal) and managers to approve or reject them. Approved leave automatically excludes those dates from attendance tracking to distinguish between approved absence and unexcused absence.

## Implementation Status

Not started. The gap analysis identifies this as CRITICAL — currently the system marks all missing attendance as "Absent" with no distinction between approved leave and unexcused absence. A new `leave_requests` table needs to be created.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-EMP-10 | Submit leave request | [story](US-EMP-10%20-%20Submit%20leave%20request/story.md) |
| US-EMP-11 | Approve or reject leave request | [story](US-EMP-11%20-%20Approve%20or%20reject%20leave%20request/story.md) |
| US-EMP-12 | View leave calendar and balance | [story](US-EMP-12%20-%20View%20leave%20calendar%20and%20balance/story.md) |
