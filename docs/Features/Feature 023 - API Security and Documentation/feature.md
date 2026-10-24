# Feature 023 — API Security and Documentation

| Field | Value |
|-------|-------|
| **Domain** | SYS |
| **Status** | Partially Implemented |

## Description

API security hardening (rate limiting, input validation, CORS configuration) and interactive API documentation via OpenAPI/Swagger. Ensures the API is robust against common attacks and well-documented for frontend developers and future integrations.

## Implementation Status

**Partially implemented.** CORS is configured in `SecurityConfig.java` (allows `http://localhost:5173` for development). CSRF protection is enabled with cookie-based token (`CookieCsrfTokenRepository.withHttpOnlyFalse()`). Session-based authentication with Spring Security is working. **NOT YET IMPLEMENTED**: rate limiting, comprehensive input validation (currently relies on `@NotBlank` and similar annotations — no global validation error handler), OpenAPI/Swagger documentation.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-SYS-11 | Add rate limiting and input validation | [story](US-SYS-11%20-%20Add%20rate%20limiting%20and%20input%20validation/story.md) |
| US-SYS-12 | Generate OpenAPI documentation | [story](US-SYS-12%20-%20Generate%20OpenAPI%20documentation/story.md) |
