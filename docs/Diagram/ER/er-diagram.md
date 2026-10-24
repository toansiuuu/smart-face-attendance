# ER Diagram: Database Schema

## Current Schema (7 Tables)

```mermaid
erDiagram
    employees {
        bigint id PK
        varchar employee_code UK
        varchar full_name
        enum status "ACTIVE | INACTIVE"
        boolean has_face_data
        datetime created_at
        datetime updated_at
    }

    user_accounts {
        bigint id PK
        bigint employee_id FK
        varchar username UK
        varchar password_hash
        enum role "MANAGER | EMPLOYEE"
        boolean enabled
    }

    shifts {
        bigint id PK
        varchar shift_code UK
        varchar shift_name
        date effective_from
        datetime created_at
    }

    shift_milestones {
        bigint id PK
        bigint shift_id FK
        enum milestone_type "MORNING_IN | LUNCH_OUT | AFTERNOON_IN | WORK_OUT"
        time window_start
        time target_time
        time window_end
    }

    attendance_events {
        bigint id PK
        bigint employee_id FK
        date work_date
        enum milestone_type
        time scanned_at
        varchar source "FACE_SCAN | MANUAL_CORRECTION"
        datetime created_at
    }

    correction_requests {
        bigint id PK
        bigint employee_id FK
        date work_date
        enum milestone_type
        time requested_time
        varchar reason
        enum status "PENDING | APPROVED | REJECTED"
        bigint reviewed_by FK
        datetime reviewed_at
        datetime created_at
    }

    face_embeddings {
        bigint id PK
        bigint employee_id FK
        text embedding_data
        datetime created_at
    }

    employees ||--|| user_accounts : "has account"
    employees ||--o{ attendance_events : "records"
    employees ||--o{ correction_requests : "submits"
    employees ||--o{ face_embeddings : "has face data"
    shifts ||--|{ shift_milestones : "defines"
    employees }o--|| employees : "reviewed_by"
```

## Proposed Schema (13 Tables, Phase 1-4 additions)

```mermaid
erDiagram
    employees {
        bigint id PK
        varchar employee_code UK
        varchar full_name
        enum status
        boolean has_face_data
        bigint department_id FK "NEW"
        datetime created_at
        datetime updated_at
    }

    departments {
        bigint id PK
        varchar name UK
        varchar description
        bigint manager_id FK
    }

    user_accounts {
        bigint id PK
        bigint employee_id FK
        varchar username UK
        varchar password_hash
        enum role
        boolean enabled
        boolean must_change_password "NEW"
    }

    shifts {
        bigint id PK
        varchar shift_code UK
        varchar shift_name
        date effective_from
        datetime created_at
    }

    shift_milestones {
        bigint id PK
        bigint shift_id FK
        enum milestone_type
        time window_start
        time target_time
        time window_end
        int grace_minutes "NEW"
    }

    attendance_events {
        bigint id PK
        bigint employee_id FK
        date work_date
        enum milestone_type
        time scanned_at
        varchar source
        decimal confidence "NEW"
        varchar device_id FK "NEW"
        datetime created_at
    }

    daily_attendance_summary {
        bigint id PK
        bigint employee_id FK
        date work_date
        enum status "ON_TIME | LATE | ABSENT | HALF_DAY | LEAVE"
        int worked_minutes
        bigint shift_id FK
        datetime computed_at
    }

    correction_requests {
        bigint id PK
        bigint employee_id FK
        date work_date
        enum milestone_type
        time requested_time
        varchar reason
        enum status
        bigint reviewed_by FK
        varchar review_note "NEW"
        datetime reviewed_at
        datetime created_at
    }

    face_embeddings {
        bigint id PK
        bigint employee_id FK
        blob embedding_vector "CHANGED from text"
        int version "NEW"
        boolean is_active "NEW"
        datetime created_at
    }

    devices {
        bigint id PK
        varchar device_code UK
        varchar location
        boolean is_active
    }

    audit_log {
        bigint id PK
        bigint user_id FK
        varchar action
        varchar entity_type
        bigint entity_id
        text old_value
        text new_value
        datetime created_at
    }

    leave_requests {
        bigint id PK
        bigint employee_id FK
        date start_date
        date end_date
        enum leave_type "ANNUAL | SICK | PERSONAL | OTHER"
        enum status "PENDING | APPROVED | REJECTED"
        varchar reason
        bigint reviewed_by FK
        datetime created_at
    }

    notifications {
        bigint id PK
        bigint user_id FK
        varchar title
        text message
        boolean is_read
        datetime created_at
    }

    employees }o--|| departments : "belongs to"
    departments ||--|| employees : "managed by"
    employees ||--|| user_accounts : "has account"
    employees ||--o{ attendance_events : "records"
    employees ||--o{ correction_requests : "submits"
    employees ||--o{ face_embeddings : "has face data"
    employees ||--o{ daily_attendance_summary : "summarized"
    employees ||--o{ leave_requests : "requests leave"
    shifts ||--|{ shift_milestones : "defines"
    attendance_events }o--o| devices : "scanned at"
    user_accounts ||--o{ audit_log : "actions logged"
    user_accounts ||--o{ notifications : "receives"
```

## Database Change Summary

| Phase | New Tables | Modified Tables | Key Changes |
|-------|-----------|----------------|-------------|
| Phase 1 | daily_attendance_summary | shift_milestones (grace_minutes), attendance_events (confidence) | Pre-computed daily status, configurable grace period |
| Phase 2 | devices | attendance_events (device_id) | Multi-device support, device-linked scans |
| Phase 3 | departments, leave_requests | employees (department_id) | Organizational structure, leave management |
| Phase 4 | audit_log, notifications | user_accounts (must_change_password), face_embeddings (version, is_active) | Compliance logging, face data versioning |
