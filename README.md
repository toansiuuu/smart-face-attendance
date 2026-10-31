# Smart Face Attendance

Hệ thống điểm danh bằng nhận diện khuôn mặt — Đồ án chuyên ngành, Đại học Sài Gòn.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.5, Java 21, Maven |
| Frontend | React 19, Vite 8, TailwindCSS 4, React Router 7 |
| Database | MySQL 8 (Docker) |
| Auth | Session-based + CSRF (BCrypt password encoding) |
| Export | Client-side Excel via ExcelJS |
| Face Liveness | Python API using supplied ONNX detector and anti-spoofing model in `deploy/` |
| Face Identity Recognition | OpenCV SFace with a persistent embedding gallery in the Python face service |

## Run the whole program (recommended: Docker)

### Prerequisites

- Install Docker Desktop and complete its first-run setup. Use Linux containers.
- Keep several GB free on the drive containing Docker storage (normally C:).
- Internet access is needed for the first build to download images and dependencies.

You do **not** need to install Java, Node.js, Maven, or Python on Windows when
using this method. Docker runs all four services: MySQL, the Python face service
(liveness and identity matching), the Java backend, and the React frontend.

### Start on Windows Command Prompt

Open **Command Prompt (CMD)** and run:

```cmd
cd /d D:\3monthslearnOOPSQL\smart-face-attendance-main
run-all.bat
```

Use your actual project folder if you cloned it elsewhere. The `/d` above is the
Windows `cd` option; do not use the Git Bash path `/d/3monthslearnOOPSQL/...` in CMD.
You can also double-click `run-all.bat` in File Explorer.

The launcher starts Docker Desktop if necessary, generates a shared face-service
secret, builds the application, and waits for the services to become ready.
The first build can take several minutes; later runs reuse cached dependencies.
If Docker displays a setup or WSL prompt, complete it and run the launcher again.

When startup finishes, open [http://localhost:5173/login](http://localhost:5173/login).
The seeded development account is:

- Username: `admin`
- Password: `admin1234567890` (unless you changed it)

The services run in the background. Closing the terminal or browser does **not**
stop them.

### Stop the whole program

From Command Prompt, run:

```cmd
cd /d D:\3monthslearnOOPSQL\smart-face-attendance-main
docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face stop
```

This stops all four application services and keeps your employees, attendance,
face enrollments, and uploaded files. Docker Desktop itself can remain open.

**Do not use `docker compose down -v` for a normal shutdown:** it deletes the
application's database volumes, including saved face embeddings.

### Run again another time

Use the same launcher:

```cmd
cd /d D:\3monthslearnOOPSQL\smart-face-attendance-main
run-all.bat
```

Your existing data is reused. Running this after pulling source changes also
rebuilds the affected services. Older database schemas may still need the SQL
migrations in `database/migrations`; the launcher does not apply them automatically.

### Check status or read logs

Run these commands from the project folder:

```cmd
docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face ps
docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face logs -f --tail 100
```

Press `Ctrl+C` to stop following logs; this does not stop the application.
If startup reports low disk space, free space on Docker's storage drive before
retrying. If the engine is not ready, open Docker Desktop and check its status.

### Git Bash, Linux, or macOS

Start Docker, open Bash in the project folder, and run:

```bash
bash run-all.sh
```

The same Docker Compose `stop`, `ps`, and `logs` commands above work in Bash.

### Run components locally (development only)

For local development outside Docker, install a JDK compatible with the backend's
Java 17 target, Maven, a Node.js version supported by Vite (the Docker image uses
Node 22), and Python 3.11. Start MySQL with `docker compose up -d`, then follow
[the face-service setup](deploy/README.md) to configure Python and Java with matching
secrets and URLs. In a separate terminal, run `npm install` and `npm run dev`
inside `frontend`. Stop foreground development servers with `Ctrl+C` in their
respective terminals; stop MySQL with `docker compose stop mysql`.

## Project Structure

```
smart-face-attendance/
├── backend/                        Spring Boot application
│   └── src/main/java/.../
│       ├── config/                 Security, dev setup
│       ├── controller/             REST controllers
│       ├── dto/                    Request/response DTOs
│       ├── entity/                 JPA entities
│       ├── exception/              Error handling
│       ├── integration/            External service clients
│       ├── repository/             Spring Data repositories
│       └── service/                Business logic
├── frontend/                       React 19 + Vite
│   └── src/
│       ├── components/             UI components
│       ├── api.js                  API client with CSRF handling
│       └── App.jsx                 Routes
├── database/
│   ├── smart-face-attendance.sql   Schema (7 tables)
│   └── seed.sql                    Dev admin account
├── docs/
│   ├── PRD/features/               23 features, 53 user stories
│   ├── Diagram/                    UML diagrams
│   ├── Guideline/                  Git branch strategy
│   ├── API.md                      API documentation
│   └── CODE_FLOW.md                Code flow documentation
└── docker-compose.yml              MySQL 8 dev container
```

## Database Schema

7 tables, JPA `ddl-auto=validate` (schema managed by SQL, not Hibernate):

| Table | Purpose |
|-------|---------|
| `employees` | Employee records (code, name, status) |
| `user_accounts` | Login accounts (username, password_hash, role) |
| `shifts` | Shift definitions (code, name, effective_from) |
| `shift_milestones` | 4 milestones per shift with time windows |
| `attendance_events` | Raw scan records per employee per day |
| `correction_requests` | Time correction workflow (submit → approve/reject) |
| `face_enrollments` | Face enrollment records |

**Business model:** 4 milestones per day — MORNING_IN → LUNCH_OUT → AFTERNOON_IN → WORK_OUT

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | Public | Health check |
| GET | `/api/auth/csrf` | Public | Get CSRF token |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Authenticated | Logout |
| GET | `/api/auth/me` | Authenticated | Current user info |
| POST | `/api/auth/password` | Authenticated | Change password |
| GET | `/api/employees` | Manager | List employees (paginated, searchable) |
| POST | `/api/employees` | Manager | Create employee |
| PATCH | `/api/employees/{id}` | Manager | Update employee |
| POST | `/api/diem-danh` | **Public (kiosk)** | Record face attendance scan |
| POST | `/api/employees/{id}/face-enrollment` | Manager | Enroll face |
| GET | `/api/attendance` | Authenticated | View attendance records |
| GET | `/api/policy` | Authenticated | View attendance policy |
| GET | `/api/shifts` | Manager | List shifts |
| POST | `/api/shifts` | Manager | Create shift |
| GET | `/api/corrections` | Authenticated | List correction requests |
| POST | `/api/corrections` | Employee | Submit correction |
| POST | `/api/corrections/{id}/review` | Manager | Approve/reject correction |

**CSRF flow:** Call `GET /api/auth/csrf` first, then include the token as `X-CSRF-TOKEN` header on all state-changing requests.

## Frontend Routes

| Route | Role | Page |
|-------|------|------|
| `/` | Public | Face scan kiosk |
| `/login` | Public | Login |
| `/admin` | Manager | Admin dashboard (employees, attendance, shifts, corrections) |
| `/employee` | Employee | Personal attendance history & corrections |
| `/setup` | Manager | Shift configuration |

## Dev Notes

- **MySQL:** port `3307` (avoids conflict with local MySQL on 3306)
- **Backend:** port `8081`
- **Frontend:** port `5173` (Vite dev server)
- **Timezone:** `Asia/Ho_Chi_Minh` throughout (DB, backend, business logic)
- **Password policy:** minimum 12 characters, max 72 UTF-8 bytes
- **Face liveness:** see [deploy/README.md](deploy/README.md) for Python/Docker setup. Enrollment requires a guided straight/left/right/straight camera challenge with liveness and consistent identity; a single photo cannot enroll a face. Scans retain the image liveness check before identity matching.
- **Face identity recognition:** the Python service uses the added OpenCV SFace model. Enroll an employee using the manager dashboard before scanning attendance. Embeddings persist in the `face_data` Docker volume; raw face images are not stored. See [deploy/README.md](deploy/README.md).
- **DB re-init:** `docker compose down -v && docker compose up -d` (destroys data)

### Environment Variables (all optional, with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8081` | Backend port |
| `DB_URL` | `jdbc:mysql://localhost:3307/...` | JDBC URL |
| `DB_USERNAME` | `root` | MySQL user |
| `DB_PASSWORD` | `root` | MySQL password |
| `WORKING_DAYS` | *(empty)* | Comma-separated working days |
| `GRACE_MINUTES` | `0` | Late grace period |
| `RECOGNITION_URL` | *(empty)* | Face recognition service URL |
| `RECOGNITION_SECRET` | *(empty)* | Face recognition API secret |
| `LIVENESS_URL` | `http://localhost:8001` | Supplied Python liveness API |
| `LIVENESS_SECRET` | *(empty)* | Shared backend/Python secret; required for face operations |

## Git Conventions

- **Branches:** `feature/*`, `bugfix/*`, `docs/*`, `chore/*`, `hotfix/*`
- **Commits:** `type: short description` (feat, fix, docs, refactor, test, chore)
- **PR target:** `main`

See `docs/Guideline/git-branch-strategy.md` for full details.
