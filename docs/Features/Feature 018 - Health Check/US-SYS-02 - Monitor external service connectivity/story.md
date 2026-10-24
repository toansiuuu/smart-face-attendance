# US-SYS-02 — Monitor external service connectivity

| Field | Value |
|-------|-------|
| **Feature** | Health Check |
| **Domain** | SYS |

> As a DevOps engineer, I want the health check to include the status of external dependencies (database, face recognition service), so that I can quickly identify which component is causing issues.

## Acceptance Criteria

- AC1: Custom `HealthIndicator` for the face recognition service — `RecognitionServiceHealthIndicator implements HealthIndicator`
- AC2: Recognition service health check: sends `GET /api/v1/health` to the recognition service via `RecognitionClient`. If response is 200 within 3 seconds → UP; timeout or error → DOWN with details
- AC3: Database health check: built-in via Spring Boot Actuator's `DataSourceHealthIndicator` — verifies connection pool is active and a simple query (`SELECT 1`) succeeds
- AC4: HikariCP connection pool metrics exposed: active connections, idle connections, pending threads, max pool size
- AC5: Health response structure: `{ status: "UP", components: { db: { status: "UP" }, recognitionService: { status: "DOWN", details: { error: "Connection refused" } }, diskSpace: { status: "UP" } } }`
- AC6: When recognition service is DOWN, overall status is still UP (degraded mode) — attendance falls back to manual selection. Only database DOWN causes overall DOWN status
- AC7: Configure in `application.yml`: `management.endpoint.health.group.critical.include=db` and `management.endpoint.health.group.optional.include=recognitionService`
