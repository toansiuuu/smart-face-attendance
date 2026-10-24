# US-SYS-04 — Identify attendance anomalies

| Field | Value |
|-------|-------|
| **Feature** | Statistics Dashboard |
| **Domain** | SYS |

> As a manager, I want the system to highlight employees with recurring attendance issues, so that I can address problems early and provide support where needed.

## Acceptance Criteria

- AC1: "Anomalies" section on the Statistics page listing employees flagged for attention
- AC2: Flagging rules (configurable thresholds in `application.yml`):
  - Late arrivals: ≥ 3 times in the current month
  - Absences: ≥ 2 full-day absences in the current month
  - Missing milestones: ≥ 5 missing milestone scans in the current month
- AC3: `GET /api/statistics/anomalies?month={yyyy-MM}` returns a list of flagged employees with their violation counts
- AC4: Each anomaly entry shows: Employee Name, Employee Code, Department (if Feature 005 is implemented), Violation Type, Count, Last Occurrence Date
- AC5: Sorted by severity: most violations first
- AC6: Click on an employee row navigates to their individual attendance detail (Feature 010)
- AC7: No automated actions (no emails or penalties) — this is an informational tool for manager awareness only
- AC8: Anomaly data is computed on-demand from `daily_attendance_summary` — no separate storage needed
