# Feature 003 — Employee CRUD

| Field | Value |
|-------|-------|
| **Domain** | EMP |
| **Status** | Implemented |

## Description

Core employee management allowing the manager to create, view, update, and deactivate employees. Each employee is automatically linked to a user account for system access.

## Implementation Status

Fully implemented in `EmployeeService` and exposed via `ManagementController`. Create employee (`POST /api/employees`) also auto-creates a user account. Update employee (`PATCH /api/employees/{id}`) supports changing name and status. Listing (`GET /api/employees`) supports text search and pagination. Status toggle (ACTIVE/INACTIVE) also toggles the linked user account's `enabled` flag. Currently only `employeeCode` and `fullName` fields exist — department, phone, email, position fields are present in the frontend UI but disabled ("pending DB approval").

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-EMP-01 | Create new employee | [story](US-EMP-01%20-%20Create%20new%20employee/story.md) |
| US-EMP-02 | View employee list with search and pagination | [story](US-EMP-02%20-%20View%20employee%20list%20with%20search%20and%20pagination/story.md) |
| US-EMP-03 | Update employee information | [story](US-EMP-03%20-%20Update%20employee%20information/story.md) |
| US-EMP-04 | Deactivate and reactivate employee | [story](US-EMP-04%20-%20Deactivate%20and%20reactivate%20employee/story.md) |
