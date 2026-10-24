# Sequence Diagram: Work Schedule Configuration Flow

```mermaid
sequenceDiagram
    actor MGR as Manager
    participant FE as SchedulePanel
    participant BE as Spring Boot
    participant DB as MySQL

    MGR->>FE: Schedule Configuration tab
    FE->>BE: GET /api/shifts
    BE->>DB: SELECT all shifts + milestones ORDER BY effective_from DESC
    DB-->>BE: List of Shift objects
    BE-->>FE: Shifts array
    FE-->>MGR: Display list of created schedules

    MGR->>FE: Fill form: Version Code, Schedule Name, Effective From, 4 milestones (windowStart, targetTime, windowEnd)
    MGR->>FE: Submit

    FE->>BE: POST /api/shifts (shiftCode, shiftName, effectiveFrom, milestones[4]) + Session + CSRF

    BE->>BE: identity.manager() verify MANAGER role
    BE->>BE: Validate: exactly 4 milestones (MORNING_IN, LUNCH_OUT, AFTERNOON_IN, WORK_OUT)
    BE->>BE: Validate: windowStart <= targetTime <= windowEnd for each milestone
    BE->>BE: Validate: windows do not overlap
    BE->>BE: Validate: milestone order is valid (MORNING_IN < LUNCH_OUT < AFTERNOON_IN < WORK_OUT)

    alt Not the first version
        BE->>BE: Validate: effectiveFrom must be in the future
    end

    BE->>DB: INSERT shifts + INSERT 4 shift_milestones
    DB-->>BE: OK

    BE-->>FE: Created Shift object
    FE->>FE: Reload schedule list
    FE-->>MGR: Work schedule saved
```

> This is a fixed schedule applied uniformly to all employees, not shift assignment. New versions are created only when the general working hours change; old schedules are preserved for historical attendance records.
