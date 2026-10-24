# US-SYS-09 — Containerize application with Docker

| Field | Value |
|-------|-------|
| **Feature** | DevOps and Deployment |
| **Domain** | SYS |

> As a developer, I want the entire application stack to run in Docker containers, so that the development environment is reproducible and deployment to any environment is consistent.

## Acceptance Criteria

- AC1: `Dockerfile` for Spring Boot backend: multi-stage build — stage 1: `maven:3-eclipse-temurin-21` builds the JAR; stage 2: `eclipse-temurin:21-jre-alpine` runs it. Final image size under 200MB
- AC2: `Dockerfile` for React frontend: multi-stage build — stage 1: `node:22-alpine` runs `npm run build`; stage 2: `nginx:alpine` serves the static files. Nginx config handles SPA routing (`try_files $uri /index.html`)
- AC3: `Dockerfile` for face recognition service (when built): Python-based with GPU support option
- AC4: `docker-compose.yml` orchestrates all services:
  - `db`: MySQL 8.0 with volume mount for persistence, timezone set to `Asia/Ho_Chi_Minh`, init script for schema
  - `backend`: Spring Boot, depends_on db, environment variables for DB connection
  - `frontend`: Nginx serving React build, depends_on backend, port 80
  - `recognition`: Face recognition service (when available), GPU passthrough optional
- AC5: `.env.example` with all required environment variables documented
- AC6: `docker-compose up` starts the entire stack with one command — first-run includes DB initialization
- AC7: Volume mounts for development: backend source mounted for hot-reload via Spring DevTools, frontend source mounted for Vite HMR
- AC8: Health checks configured in Docker Compose for each service — restart policy: `on-failure` with max 3 retries
