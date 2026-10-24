# Smart Face Attendance — Git Branch Strategy

## Branches

| Branch | Purpose | Merges into |
|--------|---------|-------------|
| `main` | Production-ready, protected. Never commit directly. | — |
| `development` | Integration branch. All feature/fix work lands here first. | `main` (when stable) |

## Branch naming

| Prefix | When to use | Example |
|--------|------------|---------|
| `feat/` | New feature or user story | `feat/face-recognition-service` |
| `fix/` | Bug fix | `fix/attendance-duplicate-scan` |
| `chore/` | Refactoring, reformatting, dependency updates, CI config | `chore/upgrade-spring-boot-3.5` |
| `docs/` | Documentation-only changes (diagrams, build plans, README) | `docs/add-sequence-diagrams` |
| `hotfix/` | Critical production fix (branches from `main`, merges back to both `main` and `development`) | `hotfix/csrf-token-leak` |
| `test/` | Test-only additions or test infrastructure | `test/attendance-service-unit-tests` |

## Flow

```
feat/face-recognition  ──PR──▶  development  ──PR──▶  main
fix/scan-window-bug    ──PR──▶  development  ──PR──▶  main
hotfix/critical        ──PR──▶  main + development
```

- Always pull latest `development` before branching (`git checkout development && git pull`), then create the feature branch from it
- Always branch from `development` (except `hotfix/*` which branches from `main`)
- Always PR back into `development` (except `hotfix/*`)
- Never push directly to `main` or `development`

## PR title format

```
Phase{N}/{topic} — {descriptive title}
```

Examples:
- `Phase1/daily-summary — Add daily attendance summary computation`
- `Phase2/face-service — Integrate face recognition with FastAPI`
- `Phase3/departments — Add department management and assignment`

For non-feature PRs, use the branch prefix:
- `chore: upgrade Spring Boot to 3.5`
- `fix: prevent duplicate attendance scan in same milestone`
- `docs: add ER and class diagrams`

## PR description template

Every PR must include these sections:

```markdown
## What changed?
- {Bullet list of changes}

## Why?
- {Motivation: which phase/improvement this addresses, or what problem it solves}

## Build & startup evidence
- [ ] Backend builds successfully (`./mvnw clean package` or `./gradlew build`)
- [ ] Backend starts successfully (`./mvnw spring-boot:run`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Frontend starts successfully (`npm run dev`)
- [ ] Screenshot or log snippet proving the above

## Test data
- {Sample request/response, seed data used, or "N/A" if not applicable}

## Checklist
| Item | Status | Notes |
|------|--------|-------|
| Code compiles | Done | |
| Unit tests pass | Done | |
| Manual testing done | Done | {brief note} |
| Database migration included (if applicable) | Done / N/A | |
| ... | | |
```

## Commit message format

```
{type}({scope}): Phase {N} - {imperative, lowercase summary}

{optional body}
```

For phase-related work, include `Phase {N} -` before the summary to tie commits to improvement phases. Non-phase commits (fix, chore, docs) omit the phase prefix.

| Type | When |
|------|------|
| `feat` | New feature code |
| `fix` | Bug fix |
| `chore` | Refactoring, config, dependencies |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behavior change |
| `ci` | CI/CD pipeline changes |

Examples:
- `feat(attendance): Phase 1 - add daily attendance summary computation`
- `feat(face): Phase 2 - integrate face recognition service with FastAPI`
- `feat(employee): Phase 3 - add department management`
- `fix(attendance): prevent duplicate scan for same milestone on same day`
- `chore(deps): upgrade spring-boot-starter-security to 3.4.1`
- `docs(diagrams): add sequence and ER diagrams`
- `ci(docker): add Docker Compose for development environment`

## Improvement phases (reference)

| Phase | Focus | Key branches |
|-------|-------|-------------|
| Phase 1 | Core improvements — daily summary, grace minutes, Flyway | `feat/daily-summary`, `feat/grace-minutes`, `feat/flyway-migration` |
| Phase 2 | Face recognition — AI service, device management | `feat/face-recognition-service`, `feat/device-management` |
| Phase 3 | Organization — departments, leave, notifications | `feat/departments`, `feat/leave-management`, `feat/notifications` |
| Phase 4 | Operations — audit log, monitoring, CI/CD | `feat/audit-log`, `feat/monitoring`, `ci/github-actions` |

## Rules

1. One logical change per feature branch — keep PRs focused and reviewable
2. PR must pass CI (build + tests) before merge
3. Squash merge into `development` to keep history clean
4. Delete branch after merge
5. Never force-push to `development` or `main`
6. Include database migration scripts (Flyway) for any schema change
7. Update relevant diagrams in `docs/Diagram/` when changing architecture or flows
