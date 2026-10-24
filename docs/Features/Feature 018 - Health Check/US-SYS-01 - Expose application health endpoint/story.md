# US-SYS-01 — Expose application health endpoint

| Field | Value |
|-------|-------|
| **Feature** | Health Check |
| **Domain** | SYS |

> As a DevOps engineer, I want a health check endpoint that reports the application's status, so that load balancers and monitoring tools can detect when the service is unhealthy.

## Acceptance Criteria

- AC1: `GET /actuator/health` returns `200 OK` with `{ status: "UP" }` when the application is healthy
- AC2: Returns `503 Service Unavailable` with `{ status: "DOWN" }` when any critical component is unhealthy
- AC3: Liveness probe at `GET /actuator/health/liveness` — returns UP if the JVM is running (for Kubernetes liveness check)
- AC4: Readiness probe at `GET /actuator/health/readiness` — returns UP only if the application can accept requests (DB connected, essential services available)
- AC5: Health endpoint is accessible without authentication (excluded from Spring Security filter chain via `requestMatchers("/actuator/health/**").permitAll()`)
- AC6: Detailed health info (component breakdown) available only to authenticated managers: configure `management.endpoint.health.show-details=when_authorized`
- AC7: Response includes disk space, database connection pool, and custom indicators (see US-SYS-02)
