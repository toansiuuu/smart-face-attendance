# US-SYS-12 — Generate OpenAPI documentation

| Field | Value |
|-------|-------|
| **Feature** | API Security and Documentation |
| **Domain** | SYS |

> As a developer, I want interactive API documentation generated from the codebase, so that frontend developers and future integrators can discover and test all available endpoints.

## Acceptance Criteria

- AC1: Add `springdoc-openapi-starter-webmvc-ui` dependency to `pom.xml`
- AC2: Swagger UI accessible at `/swagger-ui.html` — requires MANAGER role (excluded from public access)
- AC3: OpenAPI spec at `/v3/api-docs` in JSON format — also requires MANAGER role
- AC4: All REST controllers annotated with `@Tag(name = "...", description = "...")` for grouping:
  - Auth (`/api/auth/**`), Employees (`/api/employees/**`), Shifts (`/api/shifts/**`), Attendance (`/api/diem-danh`, `/api/attendance/**`), Corrections (`/api/corrections/**`), Face Enrollments (`/api/face-enrollments/**`)
- AC5: All endpoint methods annotated with `@Operation(summary = "...", description = "...")` and `@ApiResponse` for each HTTP status code
- AC6: Request/response DTOs annotated with `@Schema` for field descriptions, examples, and constraints
- AC7: Authentication documented: Swagger UI configured with session cookie authentication — test endpoints after logging in via the login endpoint
- AC8: CSRF token handling documented: note that `X-XSRF-TOKEN` header is required for state-changing requests, and the token is read from the `XSRF-TOKEN` cookie
- AC9: API versioning strategy documented in the OpenAPI info section: current version is v1, all endpoints under `/api/`
