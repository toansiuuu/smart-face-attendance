# Gap Analysis — Smart Face Attendance

## 1. Business Logic

| Issue | Severity | Details |
|-------|----------|---------|
| No Department Management | **CRITICAL** | The `employees` table only has `employee_code` and `full_name`. No department, position, phone, or email fields. Frontend has UI but fields are disabled ("pending DB approval"). |
| No Leave / Holiday Management | **CRITICAL** | System only has a static `workingDays` config. No table for holidays or leave requests. Absent employees are marked as "Absent" with no distinction between approved leave and unexcused absence. |
| No Statistics / Reporting | SHOULD HAVE | No monthly/quarterly statistics by department. No trend charts for tardiness or absenteeism. |
| No Notification System | SHOULD HAVE | No notifications when employees are late, when correction requests are approved/rejected, or reminders for missed check-ins (email, push, in-app). |
| No Audit Trail | NICE TO HAVE | No logging of who changed what, when. Important for compliance. |
| Uniform Shift Schedule | NICE TO HAVE | Currently only one fixed schedule for all employees. No support for different shifts by department or team. |

## 2. AI / Face Recognition Service

| Issue | Severity | Details |
|-------|----------|---------|
| Recognition Service Does Not Exist | **BLOCKER** | `RecognitionClient.java` calls an external service via HTTP, but this service has not been built. No Python/AI code exists in the repo. Without it, the entire attendance scanning feature returns 503 errors. |
| No Liveness Detection | **CRITICAL** | No anti-spoofing mechanism. Printed photos or phone screens could be used to fake attendance for another person. |
| Single Enrollment Photo | SHOULD HAVE | `face_enrollments` has a UNIQUE KEY on `employee_id` — each employee can only register one face image. Multiple angles/expressions would improve accuracy. |
| No Attendance Image Storage | NICE TO HAVE | Photos captured during attendance scanning are not saved. No evidence available for dispute resolution. |

## 3. Database Schema

| Issue | Details |
|-------|---------|
| Missing `departments` table | No organizational structure. Cannot assign permissions or generate reports by department. |
| `employees` table too simple | Missing: `phone`, `email`, `department_id`, `position`, `date_of_birth`, `avatar_url`. |
| Missing `holidays` table | Holidays are hardcoded or nonexistent. Need a dedicated table for dynamic management. |
| Missing `leave_requests` table | Cannot distinguish between approved leave and unexcused absence. |
| Missing `attendance_images` table | No storage for attendance proof photos. |
| Missing `notifications` table | No notification mechanism. |
| Missing `audit_logs` table | No change history tracking. |

## 4. Security & Infrastructure

| Issue | Severity | Details |
|-------|----------|---------|
| Public API `/api/diem-danh` | SHOULD HAVE | Attendance endpoint uses `permitAll()`. No rate-limiting — vulnerable to DoS or brute-force image submission. |
| No CORS Configuration | NICE TO HAVE | No CORS config found. Deploying frontend and backend on separate domains will cause blocked requests. |
| No Docker / CI-CD | SHOULD HAVE | No Dockerfile, docker-compose, or CI/CD pipeline. |
| No Testing | SHOULD HAVE | Zero unit tests, zero integration tests across the entire codebase. |
| No API Documentation (Swagger) | NICE TO HAVE | There is a manually written `docs/API.md` but no auto-generated Swagger/OpenAPI docs. |
