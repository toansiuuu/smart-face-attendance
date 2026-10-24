# Feature 013 — Holiday Management

| Field | Value |
|-------|-------|
| **Domain** | ATT |
| **Status** | Not Started |

## Description

Holiday and day-off management allowing the manager to define official holidays. Holidays are automatically excluded from attendance tracking so employees are not marked absent on those days. Supports both one-time and annually recurring holidays.

## Implementation Status

Not started. The gap analysis identifies this as contributing to the CRITICAL issue of no leave/holiday management. Currently the system uses a static `workingDays` configuration and does not distinguish between holidays and regular working days. A new `holidays` table is needed.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-ATT-12 | Manage holidays | [story](US-ATT-12%20-%20Manage%20holidays/story.md) |
| US-ATT-13 | Auto-exclude holidays from attendance | [story](US-ATT-13%20-%20Auto-exclude%20holidays%20from%20attendance/story.md) |
| US-ATT-14 | View holiday calendar | [story](US-ATT-14%20-%20View%20holiday%20calendar/story.md) |
