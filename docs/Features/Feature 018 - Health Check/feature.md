# Feature 018 — Health Check

| Field | Value |
|-------|-------|
| **Domain** | SYS |
| **Status** | Partially Implemented |

## Description

System health monitoring endpoints to verify that the application and its dependencies (database, face recognition service) are operational. Provides both a simple liveness probe and a detailed health check for monitoring dashboards.

## Implementation Status

Spring Boot Actuator is included as a dependency (`spring-boot-starter-actuator`). The default `/actuator/health` endpoint is available but not customized. Custom health indicators for the face recognition service and database connection pool are **NOT YET IMPLEMENTED**. No frontend health dashboard exists.

## User Stories

| US ID | Name | Link |
|-------|------|------|
| US-SYS-01 | Expose application health endpoint | [story](US-SYS-01%20-%20Expose%20application%20health%20endpoint/story.md) |
| US-SYS-02 | Monitor external service connectivity | [story](US-SYS-02%20-%20Monitor%20external%20service%20connectivity/story.md) |
