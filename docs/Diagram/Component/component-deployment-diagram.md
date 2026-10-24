# Component and Deployment Diagrams

## Current System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        FE[React 19 + Vite 8<br/>TailwindCSS 4<br/>react-router-dom 7]
        XLSX[ExcelJS + file-saver<br/>Client-side export]
    end

    subgraph "Backend Server"
        SC[Spring Security<br/>Session + CSRF]
        API[REST Controllers<br/>FaceAttendance / Management / Auth]
        SVC[Service Layer<br/>Attendance / Face / Employee / Correction / Shift]
        JPA[Spring Data JPA<br/>Hibernate]
        RC[RecognitionClient<br/>RestTemplate]
    end

    subgraph "Database"
        DB[(MySQL 8<br/>smart_face_attendance<br/>7 tables)]
    end

    subgraph "External Service"
        RS[Face Recognition Service<br/>NOT YET BUILT]
    end

    FE -->|"HTTP REST + Session Cookie + CSRF"| SC
    SC --> API
    API --> SVC
    SVC --> JPA
    JPA -->|"JDBC"| DB
    SVC --> RC
    RC -->|"HTTP REST"| RS
    FE --> XLSX

    style RS fill:#ffcdd2,stroke:#c62828
    style FE fill:#e3f2fd
    style DB fill:#e8f5e9
```

## Proposed Architecture (After Improvements)

```mermaid
graph TB
    subgraph "Docker Compose Environment"
        subgraph "Frontend Container"
            FE[React 19 + Vite 8<br/>TailwindCSS 4<br/>Nginx reverse proxy]
        end

        subgraph "Backend Container"
            SC[Spring Security<br/>Session + CSRF + Rate Limiting]
            API[REST Controllers]
            SVC[Service Layer<br/>+ Caching + Async Processing]
            JPA[Spring Data JPA + Flyway Migrations]
            RC[RecognitionClient<br/>Circuit Breaker + Retry]
            EVT[Event Publisher<br/>Audit Log + Notifications]
        end

        subgraph "Database Container"
            DB[(MySQL 8<br/>13 tables<br/>+ Indexes + Constraints)]
            FLY[Flyway<br/>Schema Versioning]
        end

        subgraph "AI Service Container"
            RS[Face Recognition Service<br/>Python + FastAPI]
            ML[ML Model<br/>FaceNet / ArcFace]
            VS[Vector Store<br/>Face Embeddings]
        end

        subgraph "Cache Container"
            RD[(Redis<br/>Session Store + Cache)]
        end

        subgraph "Monitoring"
            PROM[Prometheus<br/>Metrics Collection]
            GRAF[Grafana<br/>Dashboards]
        end
    end

    subgraph "Client Devices"
        WEB[Web Browser<br/>Admin Dashboard]
        TAB[Tablet / Kiosk<br/>Face Scan Terminal]
    end

    WEB -->|"HTTPS"| FE
    TAB -->|"HTTPS"| FE
    FE -->|"Reverse Proxy"| API
    SC --> API
    API --> SVC
    SVC --> JPA
    SVC --> RC
    SVC --> EVT
    JPA --> DB
    FLY --> DB
    RC -->|"gRPC / HTTP"| RS
    RS --> ML
    RS --> VS
    SVC -->|"Session + Cache"| RD
    API -->|"Metrics"| PROM
    PROM --> GRAF

    style RS fill:#c8e6c9,stroke:#2e7d32
    style FE fill:#e3f2fd
    style DB fill:#e8f5e9
    style RD fill:#fff3e0
```

## Component Interaction Summary

| Component | Technology | Purpose | Status |
|-----------|-----------|---------|--------|
| Frontend | React 19 + Vite 8 | Admin/Employee dashboards | IMPLEMENTED |
| Backend API | Spring Boot + JPA | REST API, business logic | IMPLEMENTED |
| Database | MySQL 8 | Persistent storage | IMPLEMENTED (7 tables) |
| Security | Spring Security | Session auth + CSRF | IMPLEMENTED |
| Face Recognition | Python + FastAPI | Face identify/enroll | NOT BUILT |
| Redis Cache | Redis | Session store, caching | PROPOSED |
| Schema Migration | Flyway | Version-controlled DDL | PROPOSED |
| Monitoring | Prometheus + Grafana | System observability | PROPOSED |
| Containerization | Docker Compose | Deployment orchestration | PROPOSED |

## Deployment Phases

| Phase | Components Added | Infrastructure Changes |
|-------|-----------------|----------------------|
| Phase 1 | Daily summary table, grace minutes | Flyway migration, index optimization |
| Phase 2 | Face Recognition Service, device management | Docker Compose, Python container, gRPC |
| Phase 3 | Departments, leave management, notifications | Redis for caching, async event processing |
| Phase 4 | Audit logging, monitoring, CI/CD | Prometheus + Grafana, GitHub Actions pipeline |
