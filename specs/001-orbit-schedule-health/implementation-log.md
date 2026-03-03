# Orbit Schedule Implementation Log

## Scope

- Feature: `001-orbit-schedule-health`
- Working directory: `/home/lhs/dev/tasks`
- Log purpose: track task execution evidence, checkpoints, and commit links.

## Phase 1 - Setup (T001-T012)

### Completed

- `T001` bootstrap script created: `/home/lhs/dev/tasks/scripts/bootstrap-orbit-platform.sh`
- `T002` bootstrap executed and documented in `/home/lhs/dev/tasks/backend/orbit-platform/README.md`
- `T003` local dependency stack created: `/home/lhs/dev/tasks/deploy/local/docker-compose.orbit.yml`
- `T004` backend env template created: `/home/lhs/dev/tasks/backend/orbit-platform/.env.example`
- `T005` frontend env template created: `/home/lhs/dev/tasks/frontend/orbit-web/.env.example`
- `T006` service registry manifest created: `/home/lhs/dev/tasks/backend/orbit-platform/services/services.manifest.yaml`
- `T007` backend CI skeleton created: `/home/lhs/dev/tasks/.github/workflows/orbit-backend-ci.yml`
- `T008` frontend CI skeleton created: `/home/lhs/dev/tasks/.github/workflows/orbit-frontend-ci.yml`
- `T009` root runner config created: `/home/lhs/dev/tasks/package.json`
- `T010` baseline formatting config created: `/home/lhs/dev/tasks/.editorconfig`
- `T011` ignore rules created: `/home/lhs/dev/tasks/.gitignore`
- `T012` this progress ledger created

### Evidence (commands)

```bash
SPECIFY_FEATURE=001-orbit-schedule-health .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
bash /home/lhs/dev/tasks/scripts/bootstrap-orbit-platform.sh
git status --short --branch
```

### Notes

- Backend boilerplate snapshot is synced from:
  `/home/lhs/dev/tasks/backend/boilerplate-springboot-grpc`
- `.git` history from the boilerplate source is not copied into:
  `/home/lhs/dev/tasks/backend/orbit-platform` (rsync `--exclude .git`).
- Existing repo root `.git` remains the single source of Git history for this project.

---

## Next Checkpoint

- Start Phase 2 foundational architecture tasks (`T013-T032`)
- Commit Phase 1 as first implementation checkpoint

---

## Phase 2 - Foundational (T013-T032)

### Completed

- `T013` service boundary ADR defined from event-storming result
- `T014` event envelope JSON Schema created
- `T015` topic naming conventions documented
- `T016` `platform-event-kit` Gradle project initialized
- `T017` shared outbox entity base class implemented
- `T018` outbox publisher port defined
- `T019` replay scheduler abstraction defined
- `T020` workspace authorization gRPC interceptor implemented
- `T021` common audit event contract defined
- `T022` correlation context utility implemented
- `T023` gateway route contract bootstrap added
- `T024` gateway policy bootstrap added
- `T025` gateway aggregation recipe bootstrap added
- `T026` frontend design tokens created (light/dark, neon-blue, sharp style)
- `T027` Tailwind preset for design token mapping added
- `T028` design primitives stylesheet added
- `T029` responsive shell layout stylesheet added
- `T030` frontend app shell component added
- `T031` guarded router with auth bounce added
- `T032` shared HTTP client and error normalization added

### Additional Foundation Work

- Added `platform-event-kit/settings.gradle.kts` and Gradle wrapper files so the new shared module builds independently.
- Bootstrapped `frontend/orbit-web` as Vite + React + TypeScript app to make design platform executable.

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm install
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
```

### Validation Result

- `platform-event-kit`: `BUILD SUCCESSFUL`
- `orbit-web`: `vite build` succeeded with production bundle output in `dist/`

---

## Phase 3 - US1 Secure Login and Workspace Entry (T033-T042)

### Completed

- Added US1 contract test: `tests/contract/us1-auth-gateway.contract.test.ts`
- Added US1 E2E scenario: `tests/e2e/us1-login-workspace.spec.ts`
- Scaffolded `identity-access-service` from `auth-service`
- Implemented workspace claim model, session policy persistence model, and session service
- Implemented identity gRPC API (`GetWorkspaceClaims`)
- Wired gateway auth path to identity-access gRPC via `AuthClient` + `AuthController`
- Implemented frontend login page with session bootstrap storage
- Implemented frontend workspace entry page with claim fetch and rendering

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us1-auth-gateway.contract.test.ts
```

### Validation Result

- `api-gateway` tests: pass
- `identity-access-service` tests: pass
- frontend production build: pass
- US1 contract test: pass
- US1 E2E playwright test: file added, execution deferred (Playwright runtime not installed in this phase)

---

## Phase 4 - US2 Profile Management and Presence (T043-T052)

### Completed

- Added US2 contract test and profile propagation integration test
- Added profile settings migration (`presence_status`, timezone, notification preference)
- Implemented `ProfileJpaRepositoryAdapter`, `NotificationPreference`, and `ProfileSettingsService`
- Extended gateway profile controller with `/api/profile/settings` GET/PATCH endpoints
- Added frontend `ProfileSettingsPage`, `PresenceBadge`, and synchronized `profileStore` (Zustand)
- Routed `/profile` to real settings page in guarded router

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/backend/orbit-platform/services/profile-service && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us2-profile.contract.test.ts tests/integration/us2-profile-propagation.test.ts
```

### Validation Result

- `api-gateway` tests: pass
- `profile-service` tests: pass
- frontend build: pass
- US2 contract/integration tests: pass

---

## Phase 5 - US3 Team Lifecycle and Role Management (T053-T064)

### Completed

- Added US3 contract and RBAC integration tests
- Scaffolded `team-service` from boilerplate and introduced dedicated team/membership migration
- Implemented team domain, membership entity, lifecycle service, and gRPC Team API
- Added gateway team endpoints (`create`, `invite`, `role update`, `list members`)
- Added frontend team management page, directory panel, and role mutation hooks
- Registered `/team` route in app shell

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/team-service && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us3-team-lifecycle.contract.test.ts tests/integration/us3-team-rbac.test.ts
```

### Validation Result

- `team-service` tests: pass
- `api-gateway` tests: pass
- frontend build: pass
- US3 contract/integration tests: pass

---

## Phase 6 - US4 Workgraph and Multi-View Operations (T065-T076)

### Completed

- Added US4 contract and dependency cycle integration tests
- Scaffolded `workgraph-service` and added work item/dependency migration
- Implemented `WorkItem` aggregate, `DependencyCycleGuard`, `WorkgraphService`, and gRPC adapter
- Added gateway `WorkItemController` for CRUD/status/dependency endpoints
- Added frontend board/timeline/table pages and routed them under `/projects/*`
- Updated app shell nav to expose board/timeline/table views

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us4-workgraph.contract.test.ts tests/integration/us4-dependency-cycle.test.ts
```

### Validation Result

- `workgraph-service` tests: pass
- `api-gateway` tests: pass
- frontend build: pass
- US4 contract/integration tests: pass

---

## Phase 7 - US5 Sprint, Backlog, and DSU Loop (T077-T088)

### Completed

- Added US5 contract and DSU pipeline integration tests
- Scaffolded `agile-ops-service` module with Gradle, app config, proto, and migration
- Implemented sprint aggregate (`Sprint`), DSU domain (`DSUEntry`), planning service, and DSU normalization service
- Implemented `AgileOpsGrpcService` entrypoint for DSU submit flow
- Added gateway `SprintController` endpoints for sprint/backlog/dsu operations
- Added frontend `SprintWorkspacePage` and `DSUComposerPanel`
- Registered `/sprint` route and app-shell navigation entry

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us5-agile-loop.contract.test.ts tests/integration/us5-dsu-pipeline.test.ts
```

### Validation Result

- `api-gateway` tests: pass
- frontend build: pass
- US5 contract/integration tests: pass

---

## Phase 8 - US6 Collaboration Thread, Mention, Inbox (T089-T100)

### Completed

- Added US6 contract and mention latency integration tests
- Scaffolded `collaboration-service` with migration, proto, and app/runtime config
- Implemented collaboration domain (`Thread`, `Mention`) and application service (`ThreadService`)
- Implemented `CollaborationGrpcService` and gateway `ThreadController`
- Extended notification-service fanout logic in `NotificationFanoutService`
- Implemented frontend `ThreadPanel` and `InboxPage`
- Routed `/inbox` to concrete collaboration inbox UI

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us6-collaboration.contract.test.ts tests/integration/us6-mention-inbox-latency.test.ts
```

### Validation Result

- `api-gateway` tests: pass
- frontend build: pass
- US6 contract/integration tests: pass

---

## Phase 9 - US7 Deep Link Auth Bounce (T101-T110)

### Completed

- Added US7 deep-link contract test and E2E auth-bounce spec file
- Scaffolded `deep-link-service` with migration/proto/domain/service/grpc adapter
- Added gateway `DeepLinkController` with issue/resolve and `/dl/{token}` bounce endpoint
- Added frontend `DeepLinkResolverPage` and post-login intent utility `restoreIntent`
- Wired deep-link route into router and integrated login return-to resolver

### Validation Evidence

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway && ./gradlew test --no-daemon
cd /home/lhs/dev/tasks/frontend/orbit-web && npm run build
cd /home/lhs/dev/tasks/frontend/orbit-web && npx vitest --root /home/lhs/dev/tasks run tests/contract/us7-deeplink.contract.test.ts
```

### Validation Result

- `api-gateway` tests: pass
- frontend build: pass
- US7 contract test: pass
- US7 E2E file added; Playwright execution deferred (runtime not installed in this phase)
