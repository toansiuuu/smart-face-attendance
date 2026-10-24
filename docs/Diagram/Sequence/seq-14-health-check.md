# Sequence Diagram: Health Check

```mermaid
sequenceDiagram
    actor Client as External Client / Monitor
    participant BE as Spring Boot
    participant DB as MySQL
    participant RS as Recognition Service

    Client->>BE: GET /api/health (permitAll, no auth required)

    par Database Check
        BE->>DB: SELECT 1 (connection test)
        DB-->>BE: OK / Error
    and Recognition Service Check
        BE->>RS: HTTP GET /health (via RecognitionClient)
        RS-->>BE: OK / Error / Timeout
    end

    alt All services healthy
        BE-->>Client: 200 { status: "UP", db: "UP", recognition: "UP" }
    else One or more services down
        BE-->>Client: 200 { status: "DEGRADED", db: "UP/DOWN", recognition: "UP/DOWN" }
    end
```

> The health endpoint is publicly accessible (permitAll) so monitoring tools can check system status without authentication. The recognition service is expected to be unavailable until it is built.
