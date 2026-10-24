# Feature 005 — Department Management

| Field | Value |
|-------|-------|
| **Domain** | EMP |
| **Status** | Not Started |

## Description

Organizational structure management allowing the manager to create departments, assign employees to departments, and view employees grouped by department. Enables department-level reporting and management.

## Implementation Status

Not started. The current `employees` table has no `department_id` column. A new `departments` table needs to be created with Flyway migration. The gap analysis identifies this as a CRITICAL missing feature — without departments, the system cannot group employees for organizational reporting.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-EMP-07 | Create and manage departments | [story](US-EMP-07%20-%20Create%20and%20manage%20departments/story.md) |
| US-EMP-08 | Assign employees to departments | [story](US-EMP-08%20-%20Assign%20employees%20to%20departments/story.md) |
| US-EMP-09 | View employees by department | [story](US-EMP-09%20-%20View%20employees%20by%20department/story.md) |
