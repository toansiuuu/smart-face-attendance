# Sequence Diagram: Face Attendance Scan Flow

```mermaid
sequenceDiagram
    actor EMP as Employee
    participant CAM as FaceCapture
    participant BE as Spring Boot
    participant AI as Recognition Service
    participant DB as MySQL

    EMP->>CAM: Stand in front of camera
    CAM->>CAM: Open webcam, display detection frame
    EMP->>CAM: Click Capture
    CAM->>CAM: Canvas to base64 JPEG

    CAM->>BE: POST /api/diem-danh (anhKhuonMat: base64)

    BE->>BE: Validate JPEG (header 0xFF 0xD8, max 2MB)

    BE->>AI: POST /recognize (image: base64, Bearer token)

    AI->>AI: Decode image, detect face
    AI->>AI: Perform liveness check
    AI->>AI: Extract 512D face embedding
    AI->>AI: Match against database embeddings
    AI-->>BE: accepted: true, externalRef: emp_001

    BE->>DB: SELECT face_enrollments WHERE external_ref = emp_001
    DB-->>BE: FaceEnrollment (employee_id: 5)

    BE->>DB: SELECT shifts WHERE effective_from <= TODAY
    DB-->>BE: Shift (milestones + windows)

    BE->>BE: Determine eventType based on current time vs windows

    BE->>DB: CHECK duplicate (employee_id + work_date + event_type)
    BE->>BE: CHECK ordered milestones

    BE->>DB: INSERT attendance_events
    DB-->>BE: OK

    BE-->>CAM: employeeName, time, shift, status

    CAM->>CAM: Display SUCCESS screen, countdown 5s
    CAM-->>EMP: Show attendance result
```

> Complete flow from employee standing in front of camera to attendance record. The Recognition Service (Python) is the component that needs to be built — currently the backend only makes HTTP calls to a configured URL.
