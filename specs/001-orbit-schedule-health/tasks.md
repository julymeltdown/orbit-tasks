# Tasks: Orbit Schedule Enterprise Collaboration & Scheduling Platform

**Input**: Design documents from `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/`
**Prerequisites**: [spec.md](/home/lhs/dev/tasks/specs/001-orbit-schedule-health/spec.md), [plan.md](/home/lhs/dev/tasks/specs/001-orbit-schedule-health/plan.md)

**Tests**: `spec.md`에 User Scenarios & Testing가 명시되어 있으므로 스토리별 계약/통합/E2E 테스트 태스크를 포함한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Story label (`[US1]` ... `[US11]`) for user-story phases only
- All task descriptions include explicit file paths

## Path Conventions

- Backend working tree: `backend/orbit-platform/services/*`
- Frontend app: `frontend/orbit-web/src/*`
- Test suites: `tests/contract`, `tests/integration`, `tests/e2e`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 작업 기반과 실행 환경을 준비한다.

- [X] T001 Create backend working tree bootstrap script in `/home/lhs/dev/tasks/scripts/bootstrap-orbit-platform.sh`
- [X] T002 Execute bootstrap and document result in `/home/lhs/dev/tasks/backend/orbit-platform/README.md`
- [X] T003 [P] Create local dependency compose stack in `/home/lhs/dev/tasks/deploy/local/docker-compose.orbit.yml`
- [X] T004 [P] Create backend shared env template in `/home/lhs/dev/tasks/backend/orbit-platform/.env.example`
- [X] T005 [P] Create frontend env template in `/home/lhs/dev/tasks/frontend/orbit-web/.env.example`
- [X] T006 Create backend service registry manifest in `/home/lhs/dev/tasks/backend/orbit-platform/services/services.manifest.yaml`
- [X] T007 [P] Create CI pipeline skeleton for backend services in `/home/lhs/dev/tasks/.github/workflows/orbit-backend-ci.yml`
- [X] T008 [P] Create CI pipeline skeleton for frontend app in `/home/lhs/dev/tasks/.github/workflows/orbit-frontend-ci.yml`
- [X] T009 Create monorepo task runner config in `/home/lhs/dev/tasks/package.json`
- [X] T010 [P] Create root lint/format baseline config in `/home/lhs/dev/tasks/.editorconfig`
- [X] T011 [P] Create root ignore rules for generated/runtime files in `/home/lhs/dev/tasks/.gitignore`
- [X] T012 Create implementation progress ledger in `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/implementation-log.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저스토리가 공통으로 의존하는 기반 아키텍처를 구축한다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 사용자 스토리 개발을 시작하지 않는다.

- [X] T013 Create backend architecture decision record for service boundaries in `/home/lhs/dev/tasks/backend/orbit-platform/docs/adr/0001-service-boundaries.md`
- [X] T014 [P] Create event envelope schema in `/home/lhs/dev/tasks/backend/orbit-platform/contracts/events/event-envelope.schema.json`
- [X] T015 [P] Create topic naming convention spec in `/home/lhs/dev/tasks/backend/orbit-platform/contracts/events/topic-conventions.md`
- [X] T016 Create platform outbox shared module gradle project in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/build.gradle.kts`
- [X] T017 [P] Implement shared outbox entity base class in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/outbox/OutboxEventEntity.java`
- [X] T018 [P] Implement shared outbox publisher port in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/outbox/OutboxPublisherPort.java`
- [X] T019 [P] Implement shared replay scheduler abstraction in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/replay/ReplayScheduler.java`
- [X] T020 Create backend common authz interceptor library in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/security/WorkspaceAuthorizationInterceptor.java`
- [X] T021 [P] Create common audit event interface in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/audit/AuditEvent.java`
- [X] T022 [P] Create common correlation ID filter/interceptor in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/trace/CorrelationContext.java`
- [X] T023 Create orbit gateway route contract bootstrap file in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/resources/contracts/route-contracts.yml`
- [X] T024 [P] Create orbit gateway policy set bootstrap file in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/resources/contracts/policies.yml`
- [X] T025 [P] Create orbit gateway aggregation recipes file in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/resources/contracts/aggregation-recipes.yml`
- [X] T026 Create frontend design token file in `/home/lhs/dev/tasks/frontend/orbit-web/src/design/tokens.css`
- [X] T027 [P] Create frontend tailwind preset with light/dark neon-blue tokens in `/home/lhs/dev/tasks/frontend/orbit-web/src/design/tailwind.preset.ts`
- [X] T028 [P] Create frontend primitives stylesheet (sharp corners, panel/card/button) in `/home/lhs/dev/tasks/frontend/orbit-web/src/design/primitives.css`
- [X] T029 [P] Create responsive shell grid stylesheet in `/home/lhs/dev/tasks/frontend/orbit-web/src/design/layout.css`
- [X] T030 Create frontend app shell component in `/home/lhs/dev/tasks/frontend/orbit-web/src/app/AppShell.tsx`
- [X] T031 Create frontend route map and guarded router in `/home/lhs/dev/tasks/frontend/orbit-web/src/app/router.tsx`
- [X] T032 Create shared API client + error normalization layer in `/home/lhs/dev/tasks/frontend/orbit-web/src/lib/http/client.ts`

**Checkpoint**: Foundation ready - user story implementation can begin.

---

## Phase 3: User Story 1 - Secure Login and Workspace Entry (Priority: P1) 🎯 MVP

**Goal**: 조직 계정 로그인, 세션 유지, 권한 기반 워크스페이스 진입을 완성한다.

**Independent Test**: 신규/기존 사용자 로그인 후 허용된 워크스페이스만 조회/진입 가능한지 확인한다.

- [X] T033 [P] [US1] Add auth gateway contract tests for login/refresh/logout in `/home/lhs/dev/tasks/tests/contract/us1-auth-gateway.contract.test.ts`
- [X] T034 [P] [US1] Add E2E login-to-workspace scenario in `/home/lhs/dev/tasks/tests/e2e/us1-login-workspace.spec.ts`
- [X] T035 [US1] Scaffold identity-access service from auth-service in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/build.gradle.kts`
- [X] T036 [P] [US1] Create workspace claim model and mapper in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/domain/WorkspaceClaim.java`
- [X] T037 [P] [US1] Implement session policy entity/repository in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/adapters/out/persistence/SessionPolicyEntity.java`
- [X] T038 [US1] Implement login + refresh + logout application service in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/application/service/SessionService.java`
- [X] T039 [US1] Implement identity gRPC API for workspace claims in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/adapters/in/grpc/IdentityGrpcService.java`
- [X] T040 [US1] Wire gateway auth controller to identity-access gRPC in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/AuthController.java`
- [X] T041 [US1] Implement frontend login page and session bootstrap in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/auth/LoginPage.tsx`
- [X] T042 [US1] Implement workspace landing selector page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`

**Checkpoint**: US1 independently functional and testable.

---

## Phase 4: User Story 2 - Profile Management and Personal Presence (Priority: P1)

**Goal**: 프로필/상태/타임존/알림 선호를 관리하고 협업 화면에 일관 반영한다.

**Independent Test**: 프로필 업데이트 후 스레드/멘션/알림 UI에 최신 값이 반영되는지 확인한다.

- [X] T043 [P] [US2] Add profile API contract tests in `/home/lhs/dev/tasks/tests/contract/us2-profile.contract.test.ts`
- [X] T044 [P] [US2] Add integration test for profile-to-mention propagation in `/home/lhs/dev/tasks/tests/integration/us2-profile-propagation.test.ts`
- [X] T045 [US2] Add profile persistence migration for preferences/presence in `/home/lhs/dev/tasks/backend/orbit-platform/services/profile-service/src/main/resources/db/migration/V1__profile_presence_preferences.sql`
- [X] T046 [P] [US2] Implement JPA profile repository adapter in `/home/lhs/dev/tasks/backend/orbit-platform/services/profile-service/src/main/java/com/orbit/profile/adapters/out/persistence/ProfileJpaRepositoryAdapter.java`
- [X] T047 [P] [US2] Implement profile preference domain model in `/home/lhs/dev/tasks/backend/orbit-platform/services/profile-service/src/main/java/com/orbit/profile/domain/NotificationPreference.java`
- [X] T048 [US2] Implement profile application service for presence/settings in `/home/lhs/dev/tasks/backend/orbit-platform/services/profile-service/src/main/java/com/orbit/profile/application/service/ProfileSettingsService.java`
- [X] T049 [US2] Expose profile settings endpoints in gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ProfileController.java`
- [X] T050 [US2] Implement frontend profile settings page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/profile/ProfileSettingsPage.tsx`
- [X] T051 [P] [US2] Implement presence badge component for collaboration surfaces in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/profile/PresenceBadge.tsx`
- [X] T052 [US2] Implement frontend profile store synchronization in `/home/lhs/dev/tasks/frontend/orbit-web/src/stores/profileStore.ts`

**Checkpoint**: US2 independently functional and testable.

---

## Phase 5: User Story 3 - Team Lifecycle and Role Management (Priority: P1)

**Goal**: 팀 생성/초대/역할변경/권한검증의 팀 운영 생명주기를 제공한다.

**Independent Test**: 팀 생성부터 멤버 초대, 역할 변경, 팀 단위 접근 제한까지 완료되면 검증 완료.

- [X] T053 [P] [US3] Add team lifecycle contract tests in `/home/lhs/dev/tasks/tests/contract/us3-team-lifecycle.contract.test.ts`
- [X] T054 [P] [US3] Add team role enforcement integration tests in `/home/lhs/dev/tasks/tests/integration/us3-team-rbac.test.ts`
- [X] T055 [US3] Scaffold new team-service gradle module in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/build.gradle.kts`
- [X] T056 [P] [US3] Add team/membership schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/src/main/resources/db/migration/V1__team_membership.sql`
- [X] T057 [P] [US3] Implement team aggregate domain model in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/src/main/java/com/orbit/team/domain/Team.java`
- [X] T058 [P] [US3] Implement membership/role binding entities in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/src/main/java/com/orbit/team/adapters/out/persistence/TeamMembershipEntity.java`
- [X] T059 [US3] Implement invitation and role update service in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/src/main/java/com/orbit/team/application/service/TeamLifecycleService.java`
- [X] T060 [US3] Implement team permission query gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/team-service/src/main/java/com/orbit/team/adapters/in/grpc/TeamGrpcService.java`
- [X] T061 [US3] Add team endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/TeamController.java`
- [X] T062 [US3] Implement frontend team management page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/team/TeamManagementPage.tsx`
- [X] T063 [P] [US3] Implement team directory panel component in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/team/TeamDirectoryPanel.tsx`
- [X] T064 [US3] Implement frontend team role mutation hooks in `/home/lhs/dev/tasks/frontend/orbit-web/src/features/team/hooks/useTeamRoleMutations.ts`

**Checkpoint**: US3 independently functional and testable.

---

## Phase 6: User Story 4 - Work Graph and Multi-View Operations (Priority: P1)

**Goal**: Work Item과 의존성을 관리하고 보드/타임라인/캘린더/테이블 뷰 일관성을 제공한다.

**Independent Test**: 하나의 Work Item 변경이 모든 뷰에 동기 반영되고 순환 의존성이 차단되는지 확인한다.

- [X] T065 [P] [US4] Add workgraph contract tests for CRUD/dependency in `/home/lhs/dev/tasks/tests/contract/us4-workgraph.contract.test.ts`
- [X] T066 [P] [US4] Add integration test for dependency cycle guard in `/home/lhs/dev/tasks/tests/integration/us4-dependency-cycle.test.ts`
- [X] T067 [US4] Scaffold workgraph-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/build.gradle.kts`
- [X] T068 [P] [US4] Add work item and dependency schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/src/main/resources/db/migration/V1__workgraph_core.sql`
- [X] T069 [P] [US4] Implement work item aggregate and state transition rules in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/domain/WorkItem.java`
- [X] T070 [P] [US4] Implement dependency cycle validator in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/domain/DependencyCycleGuard.java`
- [X] T071 [US4] Implement workgraph application service in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/application/service/WorkgraphService.java`
- [X] T072 [US4] Implement workgraph gRPC endpoints in `/home/lhs/dev/tasks/backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/adapters/in/grpc/WorkgraphGrpcService.java`
- [X] T073 [US4] Add work-item endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`
- [X] T074 [US4] Implement kanban board page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T075 [P] [US4] Implement timeline and calendar pages in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [X] T076 [P] [US4] Implement table view page with shared filters in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/TablePage.tsx`

**Checkpoint**: US4 independently functional and testable.

---

## Phase 7: User Story 5 - Sprint, Backlog, and DSU Operating Loop (Priority: P1)

**Goal**: 스프린트/백로그/DSU/회고 루프를 운영 시스템으로 연결한다.

**Independent Test**: 스프린트 생성 → DSU 입력 → 블로커 구조화 → 액션 전환 흐름이 완결되면 검증 완료.

- [X] T077 [P] [US5] Add sprint/dsu contract tests in `/home/lhs/dev/tasks/tests/contract/us5-agile-loop.contract.test.ts`
- [X] T078 [P] [US5] Add DSU extraction integration tests in `/home/lhs/dev/tasks/tests/integration/us5-dsu-pipeline.test.ts`
- [X] T079 [US5] Scaffold agile-ops-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/build.gradle.kts`
- [X] T080 [P] [US5] Add sprint/backlog/dsu schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V1__agile_ops.sql`
- [X] T081 [P] [US5] Implement sprint aggregate and lifecycle rules in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/domain/Sprint.java`
- [X] T082 [P] [US5] Implement DSU domain model with raw/structured payload in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/domain/DSUEntry.java`
- [X] T083 [US5] Implement backlog and sprint planning service in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/SprintPlanningService.java`
- [X] T084 [US5] Implement DSU normalization service (rule-based first pass) in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DSUNormalizationService.java`
- [X] T085 [US5] Implement agile-ops gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/adapters/in/grpc/AgileOpsGrpcService.java`
- [X] T086 [US5] Add sprint/backlog/dsu gateway endpoints in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [X] T087 [US5] Implement frontend sprint workspace page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [X] T088 [US5] Implement DSU submission and blocker summary panel in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`

**Checkpoint**: US5 independently functional and testable.

---

## Phase 8: User Story 6 - Slack-Inspired Collaboration in Work Context (Priority: P1)

**Goal**: 업무 객체 내부 스레드/멘션/알림 인박스를 제공해 실행 맥락을 보존한다.

**Independent Test**: Work Item 내 스레드 생성, 멘션, 인박스 알림 도달/읽음 처리 흐름이 독립 동작해야 한다.

- [X] T089 [P] [US6] Add collaboration contract tests for thread/mention/inbox in `/home/lhs/dev/tasks/tests/contract/us6-collaboration.contract.test.ts`
- [X] T090 [P] [US6] Add mention-to-inbox latency integration test in `/home/lhs/dev/tasks/tests/integration/us6-mention-inbox-latency.test.ts`
- [X] T091 [US6] Scaffold collaboration-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/build.gradle.kts`
- [X] T092 [P] [US6] Add thread/message/mention schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/src/main/resources/db/migration/V1__collaboration_core.sql`
- [X] T093 [P] [US6] Implement thread aggregate and status transitions in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/domain/Thread.java`
- [X] T094 [P] [US6] Implement mention parser and explicit mention command model in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/domain/Mention.java`
- [X] T095 [US6] Implement collaboration application service in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/application/service/ThreadService.java`
- [X] T096 [US6] Implement collaboration gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/adapters/in/grpc/CollaborationGrpcService.java`
- [X] T097 [US6] Extend notification-service fan-out rules for mentions/threads in `/home/lhs/dev/tasks/backend/orbit-platform/services/notification-service/src/main/java/com/orbit/notification/application/service/NotificationFanoutService.java`
- [X] T098 [US6] Add thread/mention gateway endpoints in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java`
- [X] T099 [US6] Implement frontend thread panel in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`
- [X] T100 [US6] Implement frontend notification inbox page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/inbox/InboxPage.tsx`

**Checkpoint**: US6 independently functional and testable.

---

## Phase 9: User Story 7 - Deep Link-First Collaboration Navigation (Priority: P1)

**Goal**: 알림/멘션/외부 링크에서 인증/권한을 거쳐 정확한 객체 컨텍스트로 복귀시킨다.

**Independent Test**: 로그인 상태별 딥링크 진입/재인증 복귀/권한 차단이 일관 동작해야 한다.

- [X] T101 [P] [US7] Add deep-link routing contract tests in `/home/lhs/dev/tasks/tests/contract/us7-deeplink.contract.test.ts`
- [X] T102 [P] [US7] Add E2E deep-link auth-bounce scenario in `/home/lhs/dev/tasks/tests/e2e/us7-deeplink-auth-bounce.spec.ts`
- [X] T103 [US7] Scaffold deep-link-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/deep-link-service/build.gradle.kts`
- [X] T104 [P] [US7] Add deep-link token schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/deep-link-service/src/main/resources/db/migration/V1__deep_link_tokens.sql`
- [X] T105 [P] [US7] Implement deep-link aggregate and TTL policy in `/home/lhs/dev/tasks/backend/orbit-platform/services/deep-link-service/src/main/java/com/orbit/deeplink/domain/DeepLinkToken.java`
- [X] T106 [US7] Implement deep-link resolution service with authz checks in `/home/lhs/dev/tasks/backend/orbit-platform/services/deep-link-service/src/main/java/com/orbit/deeplink/application/service/DeepLinkResolutionService.java`
- [X] T107 [US7] Implement deep-link gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/deep-link-service/src/main/java/com/orbit/deeplink/adapters/in/grpc/DeepLinkGrpcService.java`
- [X] T108 [US7] Add `/dl/{token}` gateway endpoint and bounce handling in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/DeepLinkController.java`
- [X] T109 [US7] Implement frontend deep-link resolver page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/deeplink/DeepLinkResolverPage.tsx`
- [X] T110 [US7] Implement frontend post-login return resolver utility in `/home/lhs/dev/tasks/frontend/orbit-web/src/lib/routing/restoreIntent.ts`

**Checkpoint**: US7 independently functional and testable.

---

## Phase 10: User Story 8 - Schedule Health Evaluation and AI Coach (Priority: P1)

**Goal**: 결정론 분석 + LLM 구조화 결과 + 실패 폴백을 포함한 일정 평가를 제공한다.

**Independent Test**: 평가 실행 시 건강도/리스크/권고/질문이 구조화되어 반환되고 AI 실패 시 폴백이 반환되어야 한다.

- [ ] T111 [P] [US8] Add schedule evaluation contract tests in `/home/lhs/dev/tasks/tests/contract/us8-schedule-evaluation.contract.test.ts`
- [ ] T112 [P] [US8] Add integration tests for fallback and confidence gating in `/home/lhs/dev/tasks/tests/integration/us8-ai-fallback-confidence.test.ts`
- [ ] T113 [US8] Scaffold schedule-intelligence-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/build.gradle.kts`
- [ ] T114 [P] [US8] Add evaluation/risk schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/db/migration/V1__schedule_evaluation.sql`
- [ ] T115 [P] [US8] Implement deterministic risk engine in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/DeterministicRiskEngine.java`
- [ ] T116 [P] [US8] Implement evaluation result schema validator in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/EvaluationSchemaValidator.java`
- [ ] T117 [P] [US8] Implement LLM gateway adapter with redaction hook in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/adapters/out/llm/OpenAiEvaluationClient.java`
- [ ] T118 [US8] Implement evaluation orchestration service in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/ScheduleEvaluationService.java`
- [ ] T119 [US8] Implement fallback response composer in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/FallbackAdviceService.java`
- [ ] T120 [US8] Implement schedule-intelligence gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/adapters/in/grpc/ScheduleEvaluationGrpcService.java`
- [ ] T121 [US8] Add evaluation endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [ ] T122 [P] [US8] Implement frontend AI coach side panel in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- [ ] T123 [P] [US8] Implement frontend evaluation result cards in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/insights/ScheduleHealthCards.tsx`
- [ ] T124 [US8] Implement frontend evaluation action workflow (accept/edit/ignore) in `/home/lhs/dev/tasks/frontend/orbit-web/src/features/insights/hooks/useEvaluationActions.ts`

**Checkpoint**: US8 independently functional and testable.

---

## Phase 11: User Story 9 - Portfolio Visibility and Executive Reporting (Priority: P2)

**Goal**: 프로그램/포트폴리오 단위로 건강도 추세, 위험 순위, 에스컬레이션 후보를 제공한다.

**Independent Test**: 포트폴리오 대시보드에서 프로젝트 집계 지표와 리스크 순위가 표시되면 검증 완료.

- [ ] T125 [P] [US9] Add portfolio dashboard contract tests in `/home/lhs/dev/tasks/tests/contract/us9-portfolio.contract.test.ts`
- [ ] T126 [P] [US9] Add integration test for escalation candidate ranking in `/home/lhs/dev/tasks/tests/integration/us9-escalation-ranking.test.ts`
- [ ] T127 [US9] Add portfolio projection schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/db/migration/V2__portfolio_projection.sql`
- [ ] T128 [P] [US9] Implement portfolio aggregation service in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/PortfolioAggregationService.java`
- [ ] T129 [P] [US9] Implement monthly executive report generator in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/ExecutiveReportService.java`
- [ ] T130 [US9] Add portfolio endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/PortfolioController.java`
- [ ] T131 [US9] Implement frontend portfolio overview page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/portfolio/PortfolioOverviewPage.tsx`
- [ ] T132 [P] [US9] Implement risk distribution widget in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/portfolio/RiskDistributionWidget.tsx`
- [ ] T133 [P] [US9] Implement escalation candidate table component in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/portfolio/EscalationCandidateTable.tsx`
- [ ] T134 [US9] Implement monthly report export action in `/home/lhs/dev/tasks/frontend/orbit-web/src/features/portfolio/hooks/usePortfolioExport.ts`

**Checkpoint**: US9 independently functional and testable.

---

## Phase 12: User Story 10 - Enterprise Governance and Data Controls (Priority: P2)

**Goal**: 감사로그/보존정책/AI 전송 통제/관리자 증적 조회를 제공한다.

**Independent Test**: 민감 이벤트 수행 후 감사조회/정책위반 차단/보존 실행 이력이 확인되면 검증 완료.

- [ ] T135 [P] [US10] Add governance contract tests for audit/retention/ai-control in `/home/lhs/dev/tasks/tests/contract/us10-governance.contract.test.ts`
- [ ] T136 [P] [US10] Add integration tests for AI policy enforcement in `/home/lhs/dev/tasks/tests/integration/us10-ai-policy-enforcement.test.ts`
- [ ] T137 [US10] Create immutable audit event schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/resources/db/migration/V2__audit_events.sql`
- [ ] T138 [P] [US10] Implement shared audit sink adapter in `/home/lhs/dev/tasks/backend/orbit-platform/services/platform-event-kit/src/main/java/com/orbit/eventkit/audit/AuditSinkAdapter.java`
- [ ] T139 [P] [US10] Implement retention policy entities and scheduler in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/application/service/RetentionPolicyScheduler.java`
- [ ] T140 [P] [US10] Implement AI control policy entity and evaluator in `/home/lhs/dev/tasks/backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/AIControlPolicyEvaluator.java`
- [ ] T141 [US10] Implement governance admin application service in `/home/lhs/dev/tasks/backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/application/service/GovernanceAdminService.java`
- [ ] T142 [US10] Add governance admin endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/GovernanceAdminController.java`
- [ ] T143 [US10] Implement frontend admin compliance dashboard page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/admin/ComplianceDashboardPage.tsx`
- [ ] T144 [P] [US10] Implement frontend audit event explorer in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/admin/AuditEventExplorer.tsx`
- [ ] T145 [P] [US10] Implement frontend retention/AI-control policy forms in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/admin/PolicyControlForms.tsx`
- [ ] T146 [US10] Implement governance evidence export action in `/home/lhs/dev/tasks/frontend/orbit-web/src/features/admin/hooks/useEvidenceExport.ts`

**Checkpoint**: US10 independently functional and testable.

---

## Phase 13: User Story 11 - Integrations and Guided Migration (Priority: P3)

**Goal**: 외부 연동과 가이드형 이관(검증/승인/실행/롤백)을 제공한다.

**Independent Test**: 연동 이벤트 동기화와 이관 검증 리포트/롤백 포인트 생성이 확인되면 검증 완료.

- [ ] T147 [P] [US11] Add integration/migration contract tests in `/home/lhs/dev/tasks/tests/contract/us11-migration.contract.test.ts`
- [ ] T148 [P] [US11] Add migration preview and rollback integration tests in `/home/lhs/dev/tasks/tests/integration/us11-migration-preview-rollback.test.ts`
- [ ] T149 [US11] Scaffold integration-migration-service module in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/build.gradle.kts`
- [ ] T150 [P] [US11] Add connector/import job schema migration in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/src/main/resources/db/migration/V1__integration_migration.sql`
- [ ] T151 [P] [US11] Implement connector subscription aggregate in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/src/main/java/com/orbit/migration/domain/ConnectorSubscription.java`
- [ ] T152 [P] [US11] Implement import mapping and validation service in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/src/main/java/com/orbit/migration/application/service/ImportValidationService.java`
- [ ] T153 [US11] Implement import execution and rollback snapshot service in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/src/main/java/com/orbit/migration/application/service/ImportExecutionService.java`
- [ ] T154 [US11] Implement integration-migration gRPC API in `/home/lhs/dev/tasks/backend/orbit-platform/services/integration-migration-service/src/main/java/com/orbit/migration/adapters/in/grpc/MigrationGrpcService.java`
- [ ] T155 [US11] Add integration/migration endpoints to gateway in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/IntegrationController.java`
- [ ] T156 [US11] Implement frontend import wizard page in `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/integrations/ImportWizardPage.tsx`
- [ ] T157 [P] [US11] Implement migration validation report component in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/integrations/MigrationValidationReport.tsx`
- [ ] T158 [US11] Implement integration health and retry panel in `/home/lhs/dev/tasks/frontend/orbit-web/src/components/integrations/IntegrationHealthPanel.tsx`

**Checkpoint**: US11 independently functional and testable.

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 완성도, 성능, 보안, 운영성을 강화한다.

- [ ] T159 [P] Add cross-service performance benchmark scenario in `/home/lhs/dev/tasks/tests/integration/perf/core-flow-benchmark.test.ts`
- [ ] T160 [P] Add visual regression baseline snapshots for light/dark responsive screens in `/home/lhs/dev/tasks/tests/e2e/visual/orbit-visual-baseline.spec.ts`
- [ ] T161 Harden API rate-limit/circuit-breaker defaults in `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/resources/application.yml`
- [ ] T162 [P] Add SLO dashboard and alert rules in `/home/lhs/dev/tasks/deploy/monitoring/orbit-slo-rules.yml`
- [ ] T163 [P] Add security threat model document in `/home/lhs/dev/tasks/backend/orbit-platform/docs/security/threat-model.md`
- [ ] T164 Add production runbook for incident response in `/home/lhs/dev/tasks/backend/orbit-platform/docs/runbooks/incident-response.md`
- [ ] T165 [P] Add deep-link abuse detection runbook in `/home/lhs/dev/tasks/backend/orbit-platform/docs/runbooks/deeplink-abuse-response.md`
- [ ] T166 [P] Add migration operations runbook in `/home/lhs/dev/tasks/backend/orbit-platform/docs/runbooks/migration-operations.md`
- [ ] T167 Finalize quickstart execution guide in `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/quickstart.md`
- [ ] T168 Update architecture and boundary ADR index in `/home/lhs/dev/tasks/backend/orbit-platform/docs/adr/README.md`
- [ ] T169 Run full validation checklist and record evidence in `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/release-readiness-checklist.md`
- [ ] T170 Create final implementation handoff summary in `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/implementation-handoff.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: can start immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks all user stories.
- **Phase 3~13 (User Stories)**: depend on Phase 2.
- **Phase 14 (Polish)**: depends on completion of all target user stories.

### User Story Dependencies

- **US1**: no user-story dependency (starts first after foundational).
- **US2**: depends on US1 session/profile identity context.
- **US3**: depends on US1 identity claims.
- **US4**: depends on US3 team ownership/policy context.
- **US5**: depends on US4 work-item model.
- **US6**: depends on US2 profile surface + US3 team permissions + US4 object anchors.
- **US7**: depends on US1 auth/session and US6 collaboration anchors.
- **US8**: depends on US4 + US5 data, and uses US6 signals.
- **US9**: depends on US8 evaluation outputs.
- **US10**: cross-cutting, starts after US1 baseline but completes after US8/US9 event surfaces.
- **US11**: depends on stable domain APIs from US1~US10.

### Within Each User Story

- Contract/E2E tests first.
- Domain model/migrations before service layer.
- Service layer before gateway endpoints.
- Backend APIs before frontend binding.
- Story acceptance must pass before next dependent story.

### Parallel Opportunities

- Setup/Foundational tasks marked `[P]` can run concurrently.
- In each user story, `[P]` test/model/UI leaf tasks can run in parallel.
- Independent front-end and back-end tasks can run in parallel once API contract is fixed.

---

## Parallel Example Per User Story

### US1

```bash
T033 + T034 + T036 + T037 can run in parallel.
```

### US2

```bash
T043 + T044 + T046 + T047 + T051 can run in parallel.
```

### US3

```bash
T053 + T054 + T056 + T057 + T058 + T063 can run in parallel.
```

### US4

```bash
T065 + T066 + T068 + T069 + T070 + T075 + T076 can run in parallel.
```

### US5

```bash
T077 + T078 + T080 + T081 + T082 can run in parallel.
```

### US6

```bash
T089 + T090 + T092 + T093 + T094 can run in parallel.
```

### US7

```bash
T101 + T102 + T104 + T105 can run in parallel.
```

### US8

```bash
T111 + T112 + T114 + T115 + T116 + T117 + T122 + T123 can run in parallel.
```

### US9

```bash
T125 + T126 + T128 + T129 + T132 + T133 can run in parallel.
```

### US10

```bash
T135 + T136 + T138 + T139 + T140 + T144 + T145 can run in parallel.
```

### US11

```bash
T147 + T148 + T150 + T151 + T152 + T157 can run in parallel.
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3) only.
3. Validate login/session/workspace-entry independent acceptance.
4. Demo and freeze contract.

### Incremental Delivery

1. P1 sequence: US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8
2. P2 sequence: US9 → US10
3. P3 sequence: US11
4. Polish phase after target release scope.

### Parallel Team Strategy

1. Team A: identity/team/backend core (`US1`,`US3`,`US10`)
2. Team B: workgraph/agile/intelligence (`US4`,`US5`,`US8`,`US9`)
3. Team C: collaboration/deeplink/frontend (`US2`,`US6`,`US7`,`US11`)
4. Shared platform squad: foundational, CI, event-kit, observability (`Phase 1`,`Phase 2`,`Phase 14`)

---

## Notes

- `[P]` tasks target separate files and non-blocking dependencies.
- Story labels ensure traceability from `spec.md` user stories to implementation units.
- All tasks intentionally reference `/home/lhs/dev/tasks` scope only.
