# US-EMP-05 — Add extended profile fields to employee

| Field | Value |
|-------|-------|
| **Feature** | Employee Profile Extension |
| **Domain** | EMP |

> As a manager, I want to record additional employee details (phone, email, position, date of birth, gender), so that the system has complete employee profiles for HR and organizational purposes.

## Acceptance Criteria

- AC1: Database migration adds columns to `employees` table: `phone VARCHAR(20)`, `email VARCHAR(255)`, `position VARCHAR(100)`, `date_of_birth DATE`, `gender ENUM('MALE','FEMALE','OTHER')` — all nullable for backward compatibility
- AC2: `POST /api/employees` and `PATCH /api/employees/{id}` accept the new fields in request body
- AC3: Email validation: if provided, must match standard email format; uniqueness not enforced (employee email is informational, not a login credential)
- AC4: Phone validation: if provided, must be 10-11 digits (Vietnamese phone number format)
- AC5: Date of birth validation: must be in the past, employee must be at least 16 years old
- AC6: Frontend enables the currently disabled fields in the employee form (remove "pending DB approval" tooltip)
- AC7: Employee list and detail views display the new fields
- AC8: Search (`GET /api/employees?search=`) should also match against email and phone fields
- AC9: `department_id` FK column is also added but managed by Feature 005 (Department Management)
