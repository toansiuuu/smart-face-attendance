# US-AUTH-04 — Auto-generate initial password on employee creation

| Field | Value |
|-------|-------|
| **Feature** | Password Management |
| **Domain** | AUTH |

> As a manager, I want the system to auto-generate a password when I create a new employee, so that the employee can log in immediately without a separate password setup step.

## Acceptance Criteria

- AC1: When a manager creates a new employee via `POST /api/employees`, the system automatically creates a `user_accounts` record
- AC2: Username is set to the employee's `employeeCode`
- AC3: Password is auto-generated from the employee's `fullName` initials (implementation in `EmployeeService.create()`)
- AC4: Generated password is hashed with BCrypt before storage — plaintext is never persisted
- AC5: The new account has `role = EMPLOYEE` and `enabled = true`
- AC6: The employee should be prompted or advised to change their password on first login (AC relates to US-AUTH-03)
- AC7: Account creation is atomic with employee creation — if account creation fails, the employee record should also be rolled back (transactional)
