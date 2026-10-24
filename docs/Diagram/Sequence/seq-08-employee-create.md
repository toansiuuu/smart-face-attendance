# Sequence Diagram: Employee Management — Create

```mermaid
sequenceDiagram
    actor MGR as Manager
    participant FE as Admin Dashboard
    participant BE as Spring Boot
    participant DB as MySQL

    MGR->>FE: Employee tab, click Add Employee
    FE->>FE: Display form: Employee Code, Full Name
    MGR->>FE: Fill in details, Submit

    FE->>BE: POST /api/employees (employeeCode, fullName) + Session + CSRF

    BE->>BE: identity.manager() verify MANAGER role
    BE->>BE: Validate input data

    BE->>DB: INSERT employees (employee_code, full_name, status=ACTIVE)
    DB-->>BE: Employee created

    BE->>BE: Generate username = employeeCode
    BE->>BE: Generate password from initials(fullName)
    BE->>BE: BCrypt.encode(password)
    BE->>DB: INSERT user_accounts (employee_id, username, password_hash, role=EMPLOYEE, enabled=true)
    DB-->>BE: Account created

    BE-->>FE: EmployeeResponse (id, empId, name, status, hasFaceData: false)
    FE->>FE: Refresh employee list
    FE-->>MGR: Employee added successfully
```

> When creating a new employee, the system automatically creates a user account (username = employee code, password from name initials). The employee should change their password on first login.
