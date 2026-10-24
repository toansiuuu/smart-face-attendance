# Sequence Diagram: Review Correction Request (Manager)

```mermaid
sequenceDiagram
    actor MGR as Manager
    participant FE as Admin Dashboard
    participant BE as Spring Boot
    participant DB as MySQL

    MGR->>FE: Requests tab, view PENDING list
    FE->>BE: GET /api/corrections?page=0
    BE-->>FE: List of requests

    MGR->>FE: Select request, click Approve + add note
    FE->>BE: POST /api/corrections/{id}/review (approve: true, note)

    BE->>BE: identity.manager() verify manager role
    BE->>BE: CHECK reviewer != requester (prevent self-approval)

    alt Self-approval attempt
        BE-->>FE: 403 Forbidden
        FE-->>MGR: Cannot approve your own request
    else Valid
        BE->>DB: Lock employee + Lock correction FOR UPDATE
        BE->>BE: Validate milestone order after applying correction (AttendanceMath.ordered)

        alt Invalid milestone order
            BE-->>FE: 409 Invalid milestone order
            FE-->>MGR: Display error
        else Valid order
            BE->>DB: UPDATE status=APPROVED, reviewed_by, reviewed_at, review_note
            DB-->>BE: OK
            BE-->>FE: Updated correction
            FE-->>MGR: Approved successfully
        end
    end
```

> Corrections are applied using a "soft" approach — original records in `attendance_events` are never modified. Instead, the `effective()` method merges APPROVED corrections when displaying attendance data. This ensures data integrity.
