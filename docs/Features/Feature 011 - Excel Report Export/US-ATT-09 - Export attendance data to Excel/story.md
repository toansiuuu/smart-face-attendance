# US-ATT-09 — Export attendance data to Excel

| Field | Value |
|-------|-------|
| **Feature** | Excel Report Export |
| **Domain** | ATT |

> As a manager, I want to export attendance records as an Excel file, so that I can share reports with HR or archive them for compliance.

## Acceptance Criteria

- AC1: "Export Excel" button visible in the Attendance tab of Admin Dashboard
- AC2: Export uses the currently displayed attendance data (respecting active date range and search filters)
- AC3: Processing is entirely client-side using ExcelJS library — no backend request needed
- AC4: Creates a new ExcelJS Workbook with one worksheet
- AC5: Worksheet columns: No., Employee Code, Full Name, Date, MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT, Status, Minutes Worked
- AC6: Header row is bold, column widths auto-adjusted for readability
- AC7: Time values formatted as HH:mm, dates as YYYY-MM-DD
- AC8: File is saved via file-saver library with filename pattern: `attendance-{month}-{year}.xlsx`
- AC9: Export button disabled while data is loading (prevent exporting incomplete data)
- AC10: If no data matches current filters, show a message instead of exporting an empty file
