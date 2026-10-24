# US-FACE-02 — View face enrollment status

| Field | Value |
|-------|-------|
| **Feature** | Face Enrollment |
| **Domain** | FACE |

> As a manager, I want to see which employees have enrolled their face data and which have not, so that I can follow up with unenrolled employees and ensure everyone can use face attendance.

## Acceptance Criteria

- AC1: Employee list in Admin Dashboard shows an enrollment status indicator per employee: ✅ Enrolled, ❌ Not Enrolled
- AC2: `GET /api/face-enrollments?employee_id={id}` returns enrollment record or 404 — requires `identity.manager()`
- AC3: Batch endpoint `GET /api/face-enrollments/status` returns enrollment status for all active employees in one call (used by the employee list page)
- AC4: Enrollment detail shows: enrolled date, model version, and a "Re-enroll" action button
- AC5: Filter option on employee list: "Show unenrolled only" to quickly identify employees needing enrollment
- AC6: Dashboard widget showing enrollment progress: X of Y employees enrolled (percentage bar)
- AC7: Employee can view their own enrollment status (enrolled or not) on their profile page — but cannot self-enroll
