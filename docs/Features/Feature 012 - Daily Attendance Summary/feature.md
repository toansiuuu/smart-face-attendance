# Feature 012 — Daily Attendance Summary

| Field | Value |
|-------|-------|
| **Domain** | ATT |
| **Status** | Not Started |

## Description

Computed daily attendance summaries providing aggregated statistics: total present, total late, total absent per day. Enables trend analysis and dashboard widgets without re-computing from raw events every time.

## Implementation Status

Not started. Currently, attendance status is computed on-the-fly for each request via `AttendanceService.report()`. For larger employee counts, pre-computed daily summaries would improve performance and enable dashboard widgets. A new summary computation job (scheduled or triggered at end of day) is needed.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-ATT-10 | Compute daily attendance summary | [story](US-ATT-10%20-%20Compute%20daily%20attendance%20summary/story.md) |
| US-ATT-11 | View daily summary on dashboard | [story](US-ATT-11%20-%20View%20daily%20summary%20on%20dashboard/story.md) |
