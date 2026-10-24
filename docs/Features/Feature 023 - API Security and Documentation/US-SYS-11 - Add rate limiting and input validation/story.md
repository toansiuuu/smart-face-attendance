# US-SYS-11 — Add rate limiting and input validation

| Field | Value |
|-------|-------|
| **Feature** | API Security and Documentation |
| **Domain** | SYS |

> As a developer, I want API endpoints to be protected against abuse with rate limiting and robust input validation, so that the system remains stable and secure under load.

## Acceptance Criteria

- AC1: Rate limiting via Bucket4j + Spring Boot Starter or a servlet filter:
  - Global: 100 requests/minute per IP for authenticated endpoints
  - Login endpoint (`POST /api/auth/login`): 5 attempts/minute per IP to prevent brute-force
  - Kiosk endpoint (`POST /api/diem-danh`): 30 requests/minute per IP (higher limit for legitimate rapid scans)
- AC2: Rate limit exceeded returns `429 Too Many Requests` with `Retry-After` header
- AC3: Global `@ControllerAdvice` exception handler (`GlobalExceptionHandler.java`):
  - `MethodArgumentNotValidException` → `400` with field-level error messages in Vietnamese
  - `ConstraintViolationException` → `400` with violation details
  - `AccessDeniedException` → `403`
  - `EntityNotFoundException` → `404`
  - Unhandled exceptions → `500` with generic message (no stack trace in production)
- AC4: Input validation annotations on all DTO classes:
  - `@NotBlank`, `@Size`, `@Email`, `@Pattern` for string fields
  - `@NotNull`, `@Min`, `@Max` for numeric fields
  - `@Past`, `@Future` for date fields where applicable
- AC5: SQL injection prevention: already handled by JPA parameterized queries — verify no raw SQL concatenation exists
- AC6: XSS prevention: Spring Security headers enabled (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`). Input sanitization for fields that may be rendered in HTML
- AC7: Request body size limit: 10MB max (configurable via `spring.servlet.multipart.max-file-size` and `max-request-size`)
