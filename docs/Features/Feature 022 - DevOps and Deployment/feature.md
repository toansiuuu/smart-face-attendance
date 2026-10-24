# Feature 022 — DevOps and Deployment

| Field | Value |
|-------|-------|
| **Domain** | SYS |
| **Status** | Not Started |

## Description

CI/CD pipeline, containerization, and deployment configuration for the Smart Face Attendance system. Includes Docker containerization for all services (Spring Boot backend, React frontend, MySQL, face recognition service), Docker Compose for local development, and GitHub Actions for automated build, test, and deployment.

## Implementation Status

**NOT STARTED.** Currently the application runs locally with `mvn spring-boot:run` (backend) and `npm run dev` (frontend) with no containerization or CI/CD. Planned for Phase 4 of the improvement plan. The project uses GitHub for version control with a defined branch strategy (see `docs/Guideline/git-branch-strategy.md`).

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-SYS-09 | Containerize application with Docker | [story](US-SYS-09%20-%20Containerize%20application%20with%20Docker/story.md) |
| US-SYS-10 | Set up CI/CD pipeline | [story](US-SYS-10%20-%20Set%20up%20CI-CD%20pipeline/story.md) |
