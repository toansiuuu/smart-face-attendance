# US-SYS-10 — Set up CI/CD pipeline

| Field | Value |
|-------|-------|
| **Feature** | DevOps and Deployment |
| **Domain** | SYS |

> As a developer, I want automated build, test, and deployment pipelines, so that code changes are validated automatically and deployments are reliable and repeatable.

## Acceptance Criteria

- AC1: GitHub Actions workflow: `.github/workflows/ci.yml` triggers on push to `development` and on pull requests to `development` or `main`
- AC2: CI pipeline stages:
  - **Lint**: ESLint for frontend, Checkstyle for backend
  - **Build**: `mvn package -DskipTests` (backend), `npm run build` (frontend)
  - **Test**: `mvn test` with JaCoCo coverage report, `npm test` (when tests exist)
  - **Docker Build**: Build Docker images and tag with commit SHA
- AC3: Branch protection rules on `development` and `main`: require CI passing, require at least 1 review
- AC4: CD pipeline (`.github/workflows/deploy.yml`): triggers on push to `main` only
  - Build production Docker images
  - Push to container registry (GitHub Container Registry or Docker Hub)
  - Deploy to target environment (configurable — Docker Compose on VPS, or Kubernetes)
- AC5: Environment-specific configuration via Spring profiles: `application-dev.yml`, `application-prod.yml`
- AC6: Secrets managed via GitHub Actions secrets: DB password, recognition service URL, JWT secret (if migrating from sessions later)
- AC7: Build status badge in repository README
- AC8: Deployment notification: GitHub Actions sends a notification (Discord webhook or email) on successful/failed deployments
