# Use Case Diagram — Smart Face Attendance

## Overview

```mermaid
flowchart LR
  subgraph Actors
    EMP[Employee]
    MGR[Manager]
    CAM[Camera]
    AI[AI Service]
  end

  subgraph UC_AUTH[Authentication]
    UC1[Login]
    UC2[Change Password]
    UC3[Logout]
  end

  subgraph UC_ATT[Attendance]
    UC4[Face Attendance Scan]
    UC5[View Personal Attendance]
    UC6[Submit Time Correction Request]
    UC13[View Personal Statistics]
  end

  subgraph UC_MGR[System Management]
    UC7[Employee CRUD]
    UC8[Enroll Employee Face]
    UC9[Configure Work Schedule]
    UC10[Review Correction Requests]
    UC11[View All Attendance Records]
    UC12[Export Excel Report]
    UC14[Manage Departments]
    UC15[Manage Holidays and Leave]
    UC16[View Aggregated Statistics]
  end

  subgraph UC_AI[Recognition]
    UC17[Face Recognition]
    UC18[Face Embedding Registration]
    UC19[Liveness Detection]
  end

  EMP --> UC1 & UC2 & UC3
  EMP --> UC5 & UC6 & UC13
  CAM --> UC4
  MGR --> UC1 & UC2 & UC3
  MGR --> UC7 & UC8 & UC9 & UC10 & UC11 & UC12
  MGR --> UC14 & UC15 & UC16
  UC4 --> UC17
  UC8 --> UC18
  UC17 --> UC19
  AI -.-> UC17 & UC18 & UC19

  style UC14 stroke-dasharray: 5 5, stroke: #d97706
  style UC15 stroke-dasharray: 5 5, stroke: #d97706
  style UC16 stroke-dasharray: 5 5, stroke: #d97706
  style UC19 stroke-dasharray: 5 5, stroke: #d97706
  style UC13 stroke-dasharray: 5 5, stroke: #d97706
```

> Dashed outline = proposed features (not yet implemented in the current system).

## Use Case Details

| ID | Use Case | Actor | Description | Status |
|----|----------|-------|-------------|--------|
| UC1 | Login | EMP / MGR | Authenticate with username + password, create session + CSRF token | IMPLEMENTED |
| UC2 | Change Password | EMP / MGR | Verify current password, set new password (minimum 12 characters) | IMPLEMENTED |
| UC3 | Logout | EMP / MGR | Invalidate session, clear CSRF token | IMPLEMENTED |
| UC4 | Face Attendance Scan | Camera | Capture photo, send to API, recognize face, record attendance event | IMPLEMENTED |
| UC5 | View Personal Attendance | EMP | View 4 milestones, status, worked minutes by month | IMPLEMENTED |
| UC6 | Submit Correction Request | EMP | Select date + milestone + proposed time + reason, submit as PENDING | IMPLEMENTED |
| UC7 | Employee Management | MGR | Create/update/deactivate employees + auto-create user accounts | IMPLEMENTED |
| UC8 | Face Enrollment | MGR | Capture employee photo, send to enroll endpoint, save externalRef | IMPLEMENTED |
| UC9 | Schedule Configuration | MGR | Create new schedule version with 4 milestones (target + window) | IMPLEMENTED |
| UC10 | Review Corrections | MGR | View + approve/reject, validate milestone order, prevent self-approval | IMPLEMENTED |
| UC11 | View All Attendance | MGR | All employee attendance records, filter by date/status/search | IMPLEMENTED |
| UC12 | Export Excel | MGR | Export attendance data to .xlsx file (ExcelJS) | IMPLEMENTED |
| UC13 | Personal Statistics | EMP | Personal attendance charts, tardiness trends | PROPOSED |
| UC14 | Department Management | MGR | CRUD departments, assign employees to departments | PROPOSED |
| UC15 | Leave Management | MGR / EMP | Employee submits leave request, manager approves, auto-deduct from attendance | PROPOSED |
| UC16 | Aggregated Statistics | MGR | Dashboard with charts by department, month, trends | PROPOSED |
| UC17 | Face Recognition | AI | Match face embedding against database, return externalRef | NOT BUILT |
| UC18 | Embedding Registration | AI | Create 512D face vector from photo, store in face DB | NOT BUILT |
| UC19 | Liveness Detection | AI | Detect fake photos, videos, 3D masks | PROPOSED |
