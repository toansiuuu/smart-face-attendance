# US-ATT-10 — Compute daily attendance summary

| Field | Value |
|-------|-------|
| **Feature** | Daily Attendance Summary |
| **Domain** | ATT |

> As the system, I want to compute and store a daily attendance summary at the end of each working day, so that aggregated statistics are available instantly without re-computing from raw events.

## Acceptance Criteria

- AC1: A scheduled job runs at a configurable time (e.g., 30 minutes after WORK_OUT window ends) each working day
- AC2: The job computes for each active employee: present (at least MORNING_IN recorded), late (any milestone past target + grace), absent (no events at all), on leave (approved leave request covering the date)
- AC3: Results stored in a new `attendance_daily_summaries` table: `id`, `summary_date DATE`, `total_employees INT`, `total_present INT`, `total_late INT`, `total_absent INT`, `total_on_leave INT`, `computed_at DATETIME`
- AC4: If a summary already exists for a date (re-run or correction applied), it is replaced (UPSERT)
- AC5: Summary computation uses `effective()` method to include approved corrections
- AC6: The job excludes weekends and holidays (see Feature 013) from computation
- AC7: Job execution is logged for audit purposes
