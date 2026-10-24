# Feature 007 — Work Schedule Configuration

| Field | Value |
|-------|-------|
| **Domain** | ATT |
| **Status** | Implemented |

## Description

Work schedule management based on a 4-milestone model (MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT). Each milestone has a target time and a scan window (windowStart to windowEnd). Schedules are versioned by effective date — the system automatically applies the correct schedule for any given date.

## Implementation Status

Fully implemented in `ShiftService` and exposed via `ManagementController`. Create schedule via `POST /api/shifts` with exactly 4 milestones. Validation enforces: windowStart <= targetTime <= windowEnd, no overlapping windows, milestone order (MORNING_IN < LUNCH_OUT < AFTERNOON_IN < WORK_OUT). Schedule lookup via `ShiftService.applicable(date)` returns the most recent schedule where `effective_from <= date`. Listing via `GET /api/shifts` returns all schedule versions ordered by effective date DESC.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-ATT-01 | Create shift version with milestones | [story](US-ATT-01%20-%20Create%20shift%20version%20with%20milestones/story.md) |
| US-ATT-02 | View shift history | [story](US-ATT-02%20-%20View%20shift%20history/story.md) |
