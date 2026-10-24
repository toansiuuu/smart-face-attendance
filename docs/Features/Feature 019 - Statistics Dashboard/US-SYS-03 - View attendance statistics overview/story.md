# US-SYS-03 — View attendance statistics overview

| Field | Value |
|-------|-------|
| **Feature** | Statistics Dashboard |
| **Domain** | SYS |

> As a manager, I want to see attendance statistics with visual charts, so that I can understand overall attendance trends and report to leadership.

## Acceptance Criteria

- AC1: Statistics page accessible from Admin Dashboard navigation — "Statistics" menu item
- AC2: Date range selector: this week, this month, last month, custom range. Default is current month
- AC3: KPI cards at the top: Total Employees, Average On-Time Rate (%), Total Late Arrivals, Total Absences
- AC4: Line chart: daily on-time rate trend over the selected period (x-axis: date, y-axis: percentage)
- AC5: Bar chart: attendance distribution by milestone (MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT) showing on-time vs late vs absent counts
- AC6: `GET /api/statistics/overview?from={date}&to={date}` — requires `identity.manager()`. Returns aggregated data from `daily_attendance_summary` table (Feature 012)
- AC7: Data is computed from the `daily_attendance_summary` table — if the summary has not been computed for the requested dates, the endpoint returns a warning and partial data
- AC8: Charts rendered using a lightweight React charting library (e.g., Recharts or Chart.js via react-chartjs-2)
- AC9: Export statistics to PDF or Excel for reporting purposes
