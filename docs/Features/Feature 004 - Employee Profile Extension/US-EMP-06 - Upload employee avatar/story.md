# US-EMP-06 — Upload employee avatar

| Field | Value |
|-------|-------|
| **Feature** | Employee Profile Extension |
| **Domain** | EMP |

> As a manager, I want to upload an avatar photo for each employee, so that employees are visually identifiable in the system UI.

## Acceptance Criteria

- AC1: Avatar upload accessible from the employee edit form
- AC2: Accepted formats: JPEG, PNG. Maximum file size: 2MB
- AC3: Upload endpoint: `POST /api/employees/{id}/avatar` with multipart form data, session cookie, and CSRF header
- AC4: Backend verifies `identity.manager()`
- AC5: Image is resized to 256x256 pixels on the server side and stored at a configured path (e.g., `uploads/avatars/{employeeId}.jpg`)
- AC6: `avatar_url` column in `employees` table is updated with the relative file path
- AC7: Avatar displayed in employee list (small thumbnail), employee detail view, and attendance records
- AC8: If no avatar is uploaded, display a default placeholder with the employee's initials
- AC9: Re-uploading replaces the previous avatar file and updates the URL
