# Class Diagram: Backend Architecture

## Entity Layer

```mermaid
classDiagram
    class Employee {
        -Long id
        -String employeeCode
        -String fullName
        -EmployeeStatus status
        -Boolean hasFaceData
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +isActive() boolean
    }

    class UserAccount {
        -Long id
        -Employee employee
        -String username
        -String passwordHash
        -Role role
        -Boolean enabled
    }

    class Shift {
        -Long id
        -String shiftCode
        -String shiftName
        -LocalDate effectiveFrom
        -List~ShiftMilestone~ milestones
        -LocalDateTime createdAt
    }

    class ShiftMilestone {
        -Long id
        -Shift shift
        -MilestoneType milestoneType
        -LocalTime windowStart
        -LocalTime targetTime
        -LocalTime windowEnd
    }

    class AttendanceEvent {
        -Long id
        -Employee employee
        -LocalDate workDate
        -MilestoneType milestoneType
        -LocalTime scannedAt
        -String source
        -LocalDateTime createdAt
    }

    class CorrectionRequest {
        -Long id
        -Employee employee
        -LocalDate workDate
        -MilestoneType milestoneType
        -LocalTime requestedTime
        -String reason
        -CorrectionStatus status
        -Employee reviewedBy
        -LocalDateTime reviewedAt
        -LocalDateTime createdAt
    }

    class FaceEmbedding {
        -Long id
        -Employee employee
        -String embeddingData
        -LocalDateTime createdAt
    }

    class EmployeeStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class Role {
        <<enumeration>>
        MANAGER
        EMPLOYEE
    }

    class MilestoneType {
        <<enumeration>>
        MORNING_IN
        LUNCH_OUT
        AFTERNOON_IN
        WORK_OUT
    }

    class CorrectionStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    Employee "1" --> "1" UserAccount
    Employee "1" --> "*" AttendanceEvent
    Employee "1" --> "*" CorrectionRequest
    Employee "1" --> "*" FaceEmbedding
    Shift "1" --> "4" ShiftMilestone
    CorrectionRequest "*" --> "0..1" Employee : reviewedBy
```

## Service Layer

```mermaid
classDiagram
    class AttendanceService {
        -AttendanceEventRepository eventRepo
        -CorrectionRequestRepository correctionRepo
        -ShiftService shiftService
        +report(employeeId, from, to) List~DayReport~
        +effective(employeeId, date) List~AttendanceEvent~
        +day(events, shift) DayStatus
        +workedMinutes(events) int
        -mergeCorrections(events, corrections) List~AttendanceEvent~
    }

    class FaceService {
        -RecognitionClient recognitionClient
        -FaceEmbeddingRepository embeddingRepo
        -EmployeeRepository employeeRepo
        +recordScan(imageBase64) AttendanceEvent
        +enrollFace(employeeId, imageBase64) void
        -identify(imageBase64) RecognitionResult
    }

    class EmployeeService {
        -EmployeeRepository employeeRepo
        -UserAccountRepository userRepo
        +create(dto) Employee
        +update(id, dto) Employee
        +findAll(search, pageable) Page~Employee~
        -createAccount(employee) UserAccount
        -generatePassword(fullName) String
    }

    class CorrectionService {
        -CorrectionRequestRepository correctionRepo
        -EmployeeRepository employeeRepo
        +submit(employeeId, dto) CorrectionRequest
        +review(requestId, managerId, approved) CorrectionRequest
        -checkDuplicate(employeeId, date, milestone) void
        -preventSelfApproval(requestId, managerId) void
    }

    class ShiftService {
        -ShiftRepository shiftRepo
        +create(dto) Shift
        +findAll() List~Shift~
        +currentShift() Shift
        -validate(milestones) void
    }

    class RecognitionClient {
        -RestTemplate restTemplate
        -String serviceUrl
        +identify(imageBase64) RecognitionResult
        +enroll(employeeId, imageBase64) void
        +health() boolean
    }

    class AttendanceMath {
        <<utility>>
        +isWithinWindow(scannedAt, milestone) boolean
        +computeStatus(scannedAt, targetTime, graceMinutes) String
        +workedMinutes(morningIn, lunchOut, afternoonIn, workOut) int
    }

    AttendanceService --> ShiftService
    FaceService --> RecognitionClient
    FaceService ..> AttendanceService : creates events
    CorrectionService ..> AttendanceService : corrections affect reports
    AttendanceService --> AttendanceMath
```

## Controller Layer

```mermaid
classDiagram
    class FaceAttendanceController {
        -FaceService faceService
        +scan(image) ResponseEntity "POST /api/diem-danh (permitAll)"
    }

    class ManagementController {
        -EmployeeService employeeService
        -FaceService faceService
        -AttendanceService attendanceService
        -CorrectionService correctionService
        -ShiftService shiftService
        +getEmployees(search, pageable) Page "GET /api/employees"
        +createEmployee(dto) Employee "POST /api/employees"
        +updateEmployee(id, dto) Employee "PATCH /api/employees/{id}"
        +enrollFace(id, image) void "POST /api/employees/{id}/enroll"
        +getAttendance(from, to, page) Page "GET /api/attendance"
        +getCorrections(status) List "GET /api/corrections"
        +reviewCorrection(id, dto) Correction "PATCH /api/corrections/{id}"
        +getShifts() List "GET /api/shifts"
        +createShift(dto) Shift "POST /api/shifts"
    }

    class AuthController {
        +login(credentials) ResponseEntity "POST /api/auth/login"
        +logout() ResponseEntity "POST /api/auth/logout"
        +changePassword(dto) ResponseEntity "POST /api/auth/change-password"
        +me() UserInfo "GET /api/auth/me"
        +csrf() CsrfToken "GET /api/auth/csrf"
    }

    class EmployeeSelfController {
        -AttendanceService attendanceService
        -CorrectionService correctionService
        +myAttendance(from, to) List "GET /api/attendance/me"
        +submitCorrection(dto) Correction "POST /api/corrections"
    }

    FaceAttendanceController --> FaceService
    ManagementController --> EmployeeService
    ManagementController --> FaceService
    ManagementController --> AttendanceService
    ManagementController --> CorrectionService
    ManagementController --> ShiftService
    EmployeeSelfController --> AttendanceService
    EmployeeSelfController --> CorrectionService
```
