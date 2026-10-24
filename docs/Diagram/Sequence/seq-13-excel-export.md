# Sequence Diagram: Excel Export Flow

```mermaid
sequenceDiagram
    actor MGR as Manager
    participant FE as Admin Dashboard
    participant BE as Spring Boot
    participant DB as MySQL

    MGR->>FE: Attendance tab, click Export Excel
    FE->>BE: GET /api/attendance?from=...&to=... (full range, no pagination) + Session

    BE->>BE: identity.manager() verify MANAGER role
    BE->>DB: SELECT employees + attendance_events + approved corrections
    DB-->>BE: Complete dataset

    BE->>BE: Build attendance report for all employees in range
    BE-->>FE: JSON attendance data (full dataset)

    FE->>FE: ExcelJS: create workbook
    FE->>FE: Add worksheet "Attendance Report"
    FE->>FE: Set columns: Employee Code, Full Name, Date, MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT, Status, Minutes Worked
    FE->>FE: Style header row (bold, background color)

    loop For each employee/day record
        FE->>FE: Add data row
    end

    FE->>FE: Auto-fit column widths
    FE->>FE: workbook.xlsx.writeBuffer()
    FE->>FE: file-saver: saveAs(blob, "attendance_report.xlsx")

    FE-->>MGR: Browser downloads .xlsx file
```

> Excel generation happens entirely on the client side using ExcelJS and file-saver. The backend only provides the JSON data; no server-side file generation is involved.
