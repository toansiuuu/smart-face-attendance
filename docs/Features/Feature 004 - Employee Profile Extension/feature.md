# Feature 004 — Employee Profile Extension

| Field | Value |
|-------|-------|
| **Domain** | EMP |
| **Status** | Not Started |

## Description

Extend the employee entity with additional profile fields (department, position, phone, email, date of birth, gender, avatar) to support organizational management and richer employee records.

## Implementation Status

Not started. The frontend UI already has input fields for department, phone, email, and position in the employee form, but they are disabled with a "pending DB approval" tooltip. The `employees` database table currently only has `employee_code`, `full_name`, `status`, and `created_at` columns. Database migration (Flyway) is needed to add the new columns.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-EMP-05 | Add extended profile fields to employee | [story](US-EMP-05%20-%20Add%20extended%20profile%20fields%20to%20employee/story.md) |
| US-EMP-06 | Upload employee avatar | [story](US-EMP-06%20-%20Upload%20employee%20avatar/story.md) |
