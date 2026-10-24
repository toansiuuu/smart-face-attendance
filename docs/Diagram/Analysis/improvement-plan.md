# Improvement Plan — Smart Face Attendance

## Phase 1: Build Face Recognition Service — HIGHEST PRIORITY

This is the component blocking the entire system. Without this service, the camera attendance feature does not work.

- Build Face Recognition API using Python FastAPI + InsightFace (or face_recognition/dlib)
- Two endpoints: `POST /enroll` (register face) and `POST /recognize` (identify)
- Store face embeddings (512-dimensional vectors) in database or file, mapped to `externalRef`
- Liveness detection: integrate live image verification (blink detection, head pose estimation) to prevent spoofing
- Face quality check: verify brightness, face angle, face size before processing
- Authenticate via Bearer token (matching `app.recognition-secret`)

## Phase 2: Expand Database & Business Logic — IMPORTANT

Complete the schema to support real-world organizational operations.

- Add `departments` table — department management (id, name, manager_id)
- Expand `employees` table — add: department_id, phone, email, position, date_of_birth, gender, avatar_url
- Add `holidays` table — holidays/days off (date, name, recurring yearly)
- Add `leave_requests` table — leave management: type (annual, sick, personal), start/end date, approval status
- Add `attendance_images` table — store attendance proof photos (attendance_event_id, image_path, captured_at)
- Enable existing UI — unlock the department and phone fields currently disabled on frontend

## Phase 3: Statistics, Notifications & UX — ENHANCEMENT

Increase usability and user experience.

- Statistics dashboard — charts: monthly tardiness rate, check-in time distribution, department comparison
- Notification system — in-app notifications for: tardiness, correction request approval/rejection, missed check-in reminders
- PDF report export — monthly attendance sheet, department summary reports
- Responsive mobile — optimize Dashboard sidebar for mobile (hamburger menu)
- `audit_logs` table — record every change: who, what, when

## Phase 4: DevOps, Testing & Deployment — COMPLETION

Bring the project to production-ready status.

- Docker Compose — containerize: frontend (Nginx), backend (Spring Boot), database (MySQL), recognition service (Python)
- Testing — unit tests for service layer (JUnit 5 + Mockito), integration tests for API (MockMvc)
- Rate limiting — limit requests to `/api/diem-danh` (e.g., 5 req/10s per IP)
- CORS configuration — allow frontend domain to call backend API
- Swagger/OpenAPI — auto-generated API documentation
- CI/CD pipeline — GitHub Actions: build, test, auto-deploy

## Database Change Summary

| Table | Action | Phase |
|-------|--------|-------|
| `departments` | Create — id, name, description, manager_id | Phase 2 |
| `employees` | Add columns — department_id (FK), phone, email, position, date_of_birth, gender, avatar_url | Phase 2 |
| `holidays` | Create — id, date, name, is_recurring | Phase 2 |
| `leave_requests` | Create — id, employee_id, leave_type, start_date, end_date, reason, status, approved_by, created_at | Phase 2 |
| `attendance_images` | Create — id, attendance_event_id (FK), image_path, captured_at | Phase 2 |
| `face_embeddings` | Create (recognition service) — id, employee_id, embedding (BLOB), model_version, created_at | Phase 1 |
| `notifications` | Create — id, user_account_id, type, message, is_read, created_at | Phase 3 |
| `audit_logs` | Create — id, user_account_id, action, entity_type, entity_id, old_value, new_value, created_at | Phase 3 |
