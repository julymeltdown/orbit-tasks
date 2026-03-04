# Tasks: Orbit Schedule Enterprise UI/UX Re-Architecture

**Input**: Design documents from `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 포함 (스펙에 User Scenarios & Testing이 명시되어 있고, plan에서 테스트 커버리지 게이트를 요구함)  
**Organization**: 유저스토리 단위(독립 구현/검증 가능) + 공통 Setup/Foundational/Polish

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능 (다른 파일, 선행 미의존)
- **[Story]**: 사용자 스토리 라벨 (`[US1]` ... `[US9]`)
- 모든 태스크는 구체 파일 경로 포함

## Path Conventions

- Frontend: `frontend/orbit-web/src/...`
- Backend: `backend/orbit-platform/services/<service>/src/...`
- Cross-system tests: `tests/contract`, `tests/integration`, `tests/e2e`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 독립 빌드/실행 기반과 QA 실행 기반 확보

- [X] T001 Add Gradle wrapper scripts in `backend/orbit-platform/services/agile-ops-service/gradlew` and `backend/orbit-platform/services/agile-ops-service/gradle/wrapper/`
- [X] T002 [P] Add Gradle wrapper scripts in `backend/orbit-platform/services/collaboration-service/gradlew` and `backend/orbit-platform/services/collaboration-service/gradle/wrapper/`
- [X] T003 [P] Add Gradle wrapper scripts in `backend/orbit-platform/services/deep-link-service/gradlew` and `backend/orbit-platform/services/deep-link-service/gradle/wrapper/`
- [X] T004 [P] Add Gradle wrapper scripts in `backend/orbit-platform/services/integration-migration-service/gradlew` and `backend/orbit-platform/services/integration-migration-service/gradle/wrapper/`
- [X] T005 [P] Add Gradle wrapper scripts in `backend/orbit-platform/services/schedule-intelligence-service/gradlew` and `backend/orbit-platform/services/schedule-intelligence-service/gradle/wrapper/`
- [X] T006 Create Playwright workspace config in `tests/e2e/playwright.config.ts`
- [X] T007 Add e2e package scripts and tooling in `tests/e2e/package.json`
- [X] T008 Update backend CI wrapper assumptions in `.github/workflows/orbit-backend-ci.yml`
- [X] T009 [P] Update frontend CI to run e2e smoke path in `.github/workflows/orbit-frontend-ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리에 공통 적용되는 기반(아키텍처, 계약, 품질 게이트)

**⚠️ CRITICAL**: 이 단계 완료 전 유저스토리 구현 시작 금지

- [X] T010 Create shared scope/view navigation model in `frontend/orbit-web/src/app/navigationModel.ts`
- [X] T011 Create shared project view state store in `frontend/orbit-web/src/stores/projectViewStore.ts`
- [X] T012 [P] Create reusable empty-state component in `frontend/orbit-web/src/components/common/EmptyStateCard.tsx`
- [X] T013 [P] Create overlay focus manager hook in `frontend/orbit-web/src/components/common/useFocusContainment.ts`
- [X] T014 Create API contract type module in `frontend/orbit-web/src/lib/http/contracts.ts`
- [X] T015 Align gateway route contracts to UI contract baseline in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/route-contracts.yml`
- [X] T016 [P] Align aggregation recipe keys and defaults in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/aggregation-recipes.yml`
- [X] T017 [P] Sync governance OpenAPI with route contracts in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/gateway-governance.openapi.yaml`
- [X] T018 Add JacocoCoverageVerification to `backend/orbit-platform/services/api-gateway/build.gradle.kts`
- [X] T019 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/identity-access-service/build.gradle.kts`
- [X] T020 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/workgraph-service/build.gradle.kts`
- [X] T021 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/agile-ops-service/build.gradle.kts`
- [X] T022 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/collaboration-service/build.gradle.kts`
- [X] T023 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/deep-link-service/build.gradle.kts`
- [X] T024 [P] Add JacocoCoverageVerification to `backend/orbit-platform/services/schedule-intelligence-service/build.gradle.kts`
- [X] T025 Add hex architecture test in `backend/orbit-platform/services/agile-ops-service/src/test/java/com/orbit/agile/architecture/HexArchitectureTest.java`
- [X] T026 [P] Add hex architecture test in `backend/orbit-platform/services/collaboration-service/src/test/java/com/orbit/collaboration/architecture/HexArchitectureTest.java`
- [X] T027 [P] Add hex architecture test in `backend/orbit-platform/services/deep-link-service/src/test/java/com/orbit/deeplink/architecture/HexArchitectureTest.java`
- [X] T028 [P] Add hex architecture test in `backend/orbit-platform/services/integration-migration-service/src/test/java/com/orbit/migration/architecture/HexArchitectureTest.java`
- [X] T029 [P] Add hex architecture test in `backend/orbit-platform/services/schedule-intelligence-service/src/test/java/com/orbit/schedule/architecture/HexArchitectureTest.java`

**Checkpoint**: 서비스 독립 빌드 + 계약 정렬 + 아키텍처/커버리지 게이트 준비 완료

---

## Phase 3: User Story 1 - 명확한 내비게이션 계층으로 진입 (Priority: P1) 🎯 MVP

**Goal**: Scope(글로벌)와 View(로컬)를 분리해 길찾기 혼란 제거  
**Independent Test**: 사용자 3클릭 이내 프로젝트 진입 + 같은 프로젝트 내 뷰 전환에서 문맥 상실 없음

### Tests for User Story 1

- [X] T030 [P] [US1] Add navigation hierarchy contract test in `tests/contract/us1-navigation-hierarchy.contract.test.ts`
- [X] T031 [P] [US1] Add navigation context integration test in `tests/integration/us1-scope-view-context.test.ts`
- [X] T032 [P] [US1] Add e2e scenario for 3-click project entry in `tests/e2e/us1-navigation-scope-view.spec.ts`

### Implementation for User Story 1

- [X] T033 [US1] Refactor shell top/side nav model usage in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T034 [US1] Replace duplicate page menus and remove legacy all-pages list in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T035 [US1] Update app routes to explicit scope+view semantics in `frontend/orbit-web/src/app/router.tsx`
- [X] T036 [US1] Improve workspace selection first-step flow in `frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- [X] T037 [US1] Rework operations hub entry actions to scope-first flow in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [X] T038 [US1] Persist active scope labels and fallback handling in `frontend/orbit-web/src/stores/workspaceStore.ts`
- [X] T039 [US1] Update shell/navigation layout tokens for single hierarchy in `frontend/orbit-web/src/design/layout.css`

**Checkpoint**: 글로벌 내비는 범위 선택만, 프로젝트 내부는 뷰 전환만 담당

---

## Phase 4: User Story 2 - Work Item 멀티뷰 일관성 확보 (Priority: P1)

**Goal**: Board/Table/Timeline/Calendar/Dashboard에서 동일 Work Item 데이터셋 일관 유지  
**Independent Test**: 항목 1개 생성/수정 시 5개 뷰 동기 반영 + 필터 문맥 유지

### Tests for User Story 2

- [X] T040 [P] [US2] Add work-item multiview contract test in `tests/contract/us2-workitem-multiview.contract.test.ts`
- [X] T041 [P] [US2] Add multiview parity integration test in `tests/integration/us2-multiview-parity.test.ts`
- [X] T042 [P] [US2] Add e2e view-switch state persistence test in `tests/e2e/us2-view-persistence.spec.ts`

### Implementation for User Story 2

- [X] T043 [US2] Introduce project view switch header component in `frontend/orbit-web/src/components/projects/ProjectViewTabs.tsx`
- [X] T044 [US2] Add project-level filter bar component in `frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx`
- [X] T045 [US2] Implement calendar view page in `frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- [X] T046 [US2] Implement dashboard view page in `frontend/orbit-web/src/pages/projects/DashboardPage.tsx`
- [X] T047 [US2] Wire new views and shared context routes in `frontend/orbit-web/src/app/router.tsx`
- [X] T048 [US2] Make board consume shared filter/view state in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T049 [US2] Make table consume shared filter/view state in `frontend/orbit-web/src/pages/projects/TablePage.tsx`
- [X] T050 [US2] Make timeline consume shared filter/view state in `frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [X] T051 [US2] Add view configuration hook and CRUD API calls in `frontend/orbit-web/src/features/workitems/hooks/useViewConfigurations.ts`
- [X] T052 [US2] Add project view configuration endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ProjectViewController.java`
- [X] T053 [US2] Extend work-item query/filter support in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`
- [X] T054 [US2] Persist view configurations in `backend/orbit-platform/services/workgraph-service/src/main/resources/db/migration/V2__view_configurations.sql`

**Checkpoint**: 동일 데이터셋이 5개 뷰에서 일관되고 필터/정렬 문맥 유지

---

## Phase 5: User Story 3 - 보드 조작과 고급 기능 분리 (Priority: P1)

**Goal**: 보드 고빈도 조작은 단순화하고 의존성 편집은 상세/전용 모드로 분리  
**Independent Test**: 카드 단위 드래그 안정 + 의존성 편집은 기본 툴바 비점유

### Tests for User Story 3

- [X] T055 [P] [US3] Add board drag atomicity integration test in `tests/integration/us3-board-drag-atomicity.test.ts`
- [X] T056 [P] [US3] Add dependency disclosure integration test in `tests/integration/us3-dependency-disclosure.test.ts`
- [X] T057 [P] [US3] Add e2e board drag status transition test in `tests/e2e/us3-board-dnd.spec.ts`

### Implementation for User Story 3

- [X] T058 [US3] Remove default dependency editor from board toolbar in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T059 [US3] Add dependency inspector panel component in `frontend/orbit-web/src/components/projects/DependencyInspectorPanel.tsx`
- [X] T060 [US3] Add item detail dependency mode entry in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T061 [US3] Add keyboard fallback for status change in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T062 [US3] Fix drag transform/container cohesion styles in `frontend/orbit-web/src/design/layout.css`
- [X] T063 [US3] Extend dependency APIs for upstream/downstream graph view in `frontend/orbit-web/src/features/workitems/hooks/useWorkItems.ts`
- [X] T064 [US3] Enforce dependency cycle error mapping in `backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/application/service/WorkgraphService.java`
- [X] T065 [US3] Expose dependency graph endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`

**Checkpoint**: 보드 기본 조작 집중 + 의존성은 점진 공개로 분리

---

## Phase 6: User Story 4 - 스프린트와 DSU 실행 루프 정착 (Priority: P1)

**Goal**: 스프린트 생성/백로그/DSU/블로커 확인까지 끊김 없는 운영 루프 제공  
**Independent Test**: 스프린트 없음 상태에서 CTA로 생성 후 DSU 제출/신호 확인 가능

### Tests for User Story 4

- [X] T066 [P] [US4] Add sprint-loop contract test in `tests/contract/us4-sprint-dsu-loop.contract.test.ts`
- [X] T067 [P] [US4] Add DSU signal integration test in `tests/integration/us4-dsu-signal-linking.test.ts`
- [X] T068 [P] [US4] Add e2e no-active-sprint empty-state flow in `tests/e2e/us4-sprint-empty-state.spec.ts`

### Implementation for User Story 4

- [X] T069 [US4] Implement action-oriented no-sprint empty state in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [X] T070 [US4] Add structured DSU fields and validation in `frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
- [X] T071 [US4] Link sprint filter bridge between sprint and board in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T072 [US4] Persist active sprint context in `frontend/orbit-web/src/features/agile/hooks/useActiveSprint.ts`
- [X] T073 [US4] Expose sprint create/backlog/dsu APIs in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [X] T074 [US4] Implement sprint planning persistence in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/SprintPlanningService.java`
- [X] T075 [US4] Implement DSU normalization and signal mapping in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DSUNormalizationService.java`
- [X] T076 [US4] Add sprint/DSU schema updates in `backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V2__sprint_dsu_runtime.sql`

**Checkpoint**: 스프린트 운영 루프(생성→백로그→DSU→블로커)가 독립 수행 가능

---

## Phase 7: User Story 5 - 협업 인박스와 스레드의 역할 분리 (Priority: P1)

**Goal**: 인박스는 triage, 스레드는 객체 문맥 대화로 역할 분리  
**Independent Test**: 멘션 발생 시 인박스 항목 생성 + 딥링크로 스레드 문맥 이동

### Tests for User Story 5

- [X] T077 [P] [US5] Add inbox/thread/deeplink contract test in `tests/contract/us5-collaboration-inbox.contract.test.ts`
- [X] T078 [P] [US5] Add mention-to-inbox integration test in `tests/integration/us5-mention-inbox-bridge.test.ts`
- [X] T079 [P] [US5] Add e2e inbox-open-thread flow test in `tests/e2e/us5-inbox-thread-deeplink.spec.ts`

### Implementation for User Story 5

- [X] T080 [US5] Split inbox tabs into notifications/requests in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T081 [US5] Add inbox triage actions and resolve transitions in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T082 [US5] Enhance thread composer for work-item context and mentions in `frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`
- [X] T083 [US5] Add inbox filter component in `frontend/orbit-web/src/components/collaboration/InboxFilterBar.tsx`
- [X] T084 [US5] Improve deep-link bounce handling and return intent in `frontend/orbit-web/src/pages/deeplink/DeepLinkResolverPage.tsx`
- [X] T085 [US5] Implement thread/message/mention workflows in `backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/application/service/ThreadService.java`
- [X] T086 [US5] Implement deep-link token lifecycle in `backend/orbit-platform/services/deep-link-service/src/main/java/com/orbit/deeplink/application/service/DeepLinkResolutionService.java`
- [X] T087 [US5] Bridge collaboration inbox APIs in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java`
- [X] T088 [US5] Align notification read/resolve APIs in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/NotificationController.java`
- [X] T089 [US5] Update thread-context aggregation recipe in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/aggregation-recipes.yml`

**Checkpoint**: 인박스 처리와 스레드 대화가 목적별로 분리되고 딥링크로 연결

---

## Phase 8: User Story 7 - AI 코치의 맥락형 보조 경험 (Priority: P1)

**Goal**: AI를 단일 보조 표면으로 정리하고 컨텍스트 기반 권고/근거/폴백 제공  
**Independent Test**: 현재 프로젝트/스프린트 문맥에서 AI 실행 후 근거 이동 및 폴백 안내 가능

### Tests for User Story 7

- [X] T090 [P] [US7] Add schedule-evaluation contract test in `tests/contract/us7-ai-evaluation.contract.test.ts`
- [X] T091 [P] [US7] Add fallback-confidence integration test in `tests/integration/us7-ai-fallback-path.test.ts`
- [X] T092 [P] [US7] Add e2e contextual AI panel flow in `tests/e2e/us7-contextual-ai-panel.spec.ts`

### Implementation for User Story 7

- [X] T093 [US7] Convert floating widget to launcher-only pattern in `frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`
- [X] T094 [US7] Remove navigation-like links from AI panel in `frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- [X] T095 [US7] Bind AI panel context to current route and selection in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [X] T096 [US7] Add evidence deep-links in health cards in `frontend/orbit-web/src/components/insights/ScheduleHealthCards.tsx`
- [X] T097 [US7] Enforce deterministic fallback response shape in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/FallbackAdviceService.java`
- [X] T098 [US7] Enforce schema validation and confidence handling in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/EvaluationSchemaValidator.java`
- [X] T099 [US7] Route schedule evaluation through service-only source in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [X] T100 [US7] Update OpenAI request policy defaults in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/adapters/out/llm/OpenAiEvaluationClient.java`

**Checkpoint**: AI는 단일 표면 + 컨텍스트 코치 역할로 동작, 실패 시 폴백 안내 제공

---

## Phase 9: User Story 8 - 모바일과 접근성 품질 보장 (Priority: P1)

**Goal**: 모바일 메뉴 접근 상시 보장 + 오버레이 포커스 비가림 + 키보드 대체 조작 확보  
**Independent Test**: iPhone 12 mini/15 Pro viewport + keyboard-only 시나리오 완주

### Tests for User Story 8

- [X] T101 [P] [US8] Add mobile shell navigation e2e test in `tests/e2e/us8-mobile-menu-access.spec.ts`
- [X] T102 [P] [US8] Add focus-not-obscured e2e test in `tests/e2e/us8-focus-not-obscured.spec.ts`
- [X] T103 [P] [US8] Add responsive overflow integration test in `tests/integration/us8-responsive-overflow.test.ts`
- [X] T104 [P] [US8] Add keyboard-only board action e2e test in `tests/e2e/us8-board-keyboard-fallback.spec.ts`

### Implementation for User Story 8

- [X] T105 [US8] Harden mobile menu trigger and disclosure state in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T106 [US8] Add skip-links and aria landmarks in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T107 [US8] Refine responsive shell/grid/board sizing with relative units in `frontend/orbit-web/src/design/layout.css`
- [X] T108 [US8] Improve contrast/text status semantics in `frontend/orbit-web/src/design/tokens.css`
- [X] T109 [US8] Ensure board/table card content never clips on narrow viewports in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T110 [US8] Ensure timeline/table horizontal scroll affordance on mobile in `frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [X] T111 [US8] Implement overlay focus containment for AI/widget/modal layers in `frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`

**Checkpoint**: 모바일 접근성/반응형 핵심 결함(메뉴 진입 불가, CTA 가림, 포커스 가림) 0건

---

## Phase 10: User Story 6 - 포트폴리오 진입 UX 개선 (Priority: P2)

**Goal**: 식별자 입력 기반 진입 제거, 선택형 진입 + KPI 요약 + drill-down 제공  
**Independent Test**: 포트폴리오 선택 후 상태/리스크 확인 + 상세 목록 이동 가능

### Tests for User Story 6

- [X] T112 [P] [US6] Add portfolio entry contract test in `tests/contract/us6-portfolio-entry.contract.test.ts`
- [X] T113 [P] [US6] Add portfolio drill-down integration test in `tests/integration/us6-portfolio-drilldown.test.ts`

### Implementation for User Story 6

- [X] T114 [US6] Replace raw portfolio-id input with selector-first flow in `frontend/orbit-web/src/pages/portfolio/PortfolioOverviewPage.tsx`
- [X] T115 [US6] Add portfolio selector component in `frontend/orbit-web/src/components/portfolio/PortfolioSelector.tsx`
- [X] T116 [US6] Add portfolio list hook in `frontend/orbit-web/src/features/portfolio/hooks/usePortfolioList.ts`
- [X] T117 [US6] Add KPI-to-object drilldown links in `frontend/orbit-web/src/components/portfolio/RiskDistributionWidget.tsx`
- [X] T118 [US6] Add escalation table deep-link actions in `frontend/orbit-web/src/components/portfolio/EscalationCandidateTable.tsx`
- [X] T119 [US6] Implement portfolio list/overview endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/PortfolioController.java`
- [X] T120 [US6] Implement portfolio aggregation query in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/PortfolioAggregationService.java`

**Checkpoint**: 포트폴리오 진입이 선택형으로 전환되고 KPI drill-down 동작

---

## Phase 11: User Story 9 - 관리/거버넌스 화면의 역할 명확화 (Priority: P2)

**Goal**: 관리자 전용 통제 화면(RBAC/감사/AI 정책) 분리 및 권한 기반 차단  
**Independent Test**: 관리자 접근 가능 + 일반 사용자 접근 차단 + 정책 변경 즉시 반영

### Tests for User Story 9

- [X] T121 [P] [US9] Add governance contract test in `tests/contract/us9-governance-admin.contract.test.ts`
- [X] T122 [P] [US9] Add admin RBAC integration test in `tests/integration/us9-admin-rbac.test.ts`
- [X] T123 [P] [US9] Add e2e non-admin access denial test in `tests/e2e/us9-admin-access-control.spec.ts`

### Implementation for User Story 9

- [X] T124 [US9] Refactor compliance dashboard IA and sections in `frontend/orbit-web/src/pages/admin/ComplianceDashboardPage.tsx`
- [X] T125 [US9] Add role-based tab gating in `frontend/orbit-web/src/components/admin/PolicyControlForms.tsx`
- [X] T126 [US9] Add audit explorer filtering/export flows in `frontend/orbit-web/src/components/admin/AuditEventExplorer.tsx`
- [X] T127 [US9] Enforce admin route guard in `frontend/orbit-web/src/app/router.tsx`
- [X] T128 [US9] Expose governance policy APIs in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/GovernanceAdminController.java`
- [X] T129 [US9] Expose audit policy APIs in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/PolicyAdminController.java`
- [X] T130 [US9] Implement policy evaluation in `backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/application/service/GovernanceAdminService.java`
- [X] T131 [US9] Apply policy scheduler wiring in `backend/orbit-platform/services/identity-access-service/src/main/java/com/orbit/identity/application/service/RetentionPolicyScheduler.java`

**Checkpoint**: Admin 도메인이 업무 화면과 분리되고 권한 경계 검증 완료

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: 전 스토리 공통 품질 보강, 문서/성능/회귀 안정화

- [X] T132 [P] Update feature contract snapshot in `specs/002-enterprise-uiux-overhaul/contracts/gateway-uiux.openapi.yaml`
- [X] T133 [P] Sync implementation quickstart steps in `specs/002-enterprise-uiux-overhaul/quickstart.md`
- [X] T134 Run frontend unit test updates for new hooks/components in `frontend/orbit-web/src/lib/auth/profileCompletion.test.ts`
- [X] T135 [P] Add AppShell and routing behavior tests in `frontend/orbit-web/src/app/AppShell.test.tsx`
- [X] T136 [P] Add board interaction unit tests in `frontend/orbit-web/src/pages/projects/BoardPage.test.tsx`
- [X] T137 Execute contract suite and update fixtures in `tests/contract/`
- [X] T138 [P] Execute integration suite and update fixtures in `tests/integration/`
- [X] T139 [P] Execute e2e suite and baseline snapshots in `tests/e2e/visual/orbit-visual-baseline.spec.ts`
- [X] T140 Enforce performance benchmark thresholds in `tests/integration/perf/core-flow-benchmark.test.ts`
- [X] T141 Finalize coverage gate thresholds and service exceptions in `backend/orbit-platform/services/api-gateway/build.gradle.kts`, `backend/orbit-platform/services/identity-access-service/build.gradle.kts`, `backend/orbit-platform/services/workgraph-service/build.gradle.kts`, `backend/orbit-platform/services/agile-ops-service/build.gradle.kts`, `backend/orbit-platform/services/collaboration-service/build.gradle.kts`, `backend/orbit-platform/services/deep-link-service/build.gradle.kts`, and `backend/orbit-platform/services/schedule-intelligence-service/build.gradle.kts`
- [X] T142 Run full quickstart validation and document release notes in `specs/002-enterprise-uiux-overhaul/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 진행, 모든 스토리의 선행 차단 단계
- **Phase 3~11 (User Stories)**: Phase 2 완료 후 착수 가능
- **Phase 12 (Polish)**: 목표 스토리 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: Foundation 직후 시작 가능, 내비 기준선 제공
- **US2 (P1)**: US1과 병행 가능하나 라우팅/셸 변경 충돌 주의
- **US3 (P1)**: US2의 WorkItem view-context 구조를 일부 재사용
- **US4 (P1)**: US2의 공통 객체 흐름(WorkItem/Sprint) 기반
- **US5 (P1)**: US1 내비 구조 확정 후 구현 효율 높음
- **US7 (P1)**: US4/US5의 컨텍스트 객체 연결 이후 정확도 상승
- **US8 (P1)**: US1~US7 진행 중 병행 가능, 막판 회귀 테스트 필수
- **US6 (P2)**: US2/US7 데이터 경로가 준비된 뒤 진행 권장
- **US9 (P2)**: US1 라우팅/권한 문맥 확정 이후 진행 권장

### Recommended Delivery Order (MVP-first)

1. Setup + Foundational
2. US1 → US2 → US3
3. US4 → US5 → US7
4. US8 (모바일/접근성 고정)
5. MVP 검증 배포
6. US6 → US9
7. Polish

---

## Parallel Execution Examples Per User Story

### US1

```bash
T030, T031, T032 병렬 실행 (contract/integration/e2e)
T036, T037, T039 병렬 실행 (서로 다른 frontend 파일)
```

### US2

```bash
T040, T041, T042 병렬 실행 (test 분리)
T045, T046, T051 병렬 실행 (새 페이지/훅 분리)
T052, T054 병렬 실행 (gateway vs migration 분리)
```

### US3

```bash
T055, T056, T057 병렬 실행
T059, T062, T064 병렬 실행
```

### US4

```bash
T066, T067, T068 병렬 실행
T074, T075, T076 병렬 실행
```

### US5

```bash
T077, T078, T079 병렬 실행
T083, T084, T086 병렬 실행
```

### US7

```bash
T090, T091, T092 병렬 실행
T097, T098, T100 병렬 실행
```

### US8

```bash
T101, T102, T103, T104 병렬 실행
T107, T110, T111 병렬 실행
```

### US6

```bash
T112, T113 병렬 실행
T115, T116, T118 병렬 실행
```

### US9

```bash
T121, T122, T123 병렬 실행
T125, T126, T130 병렬 실행
```

---

## Implementation Strategy

### MVP First (P1 Stories)

1. Phase 1~2 완료
2. US1~US5, US7, US8 구현
3. 핵심 5개 작업(보드 이동, 항목 생성, 스프린트 생성, DSU 제출, 인박스 처리) 검증
4. 회귀/접근성/모바일 기준 통과 시 MVP 배포

### Incremental Delivery

1. MVP 배포 후 US6(Portfolio) 추가
2. US9(Admin/Governance) 추가
3. Phase 12 폴리시/성능/문서 마감

### Quality Gate Before `/speckit.implement`

1. `tasks.md`의 모든 태스크가 파일 경로 포함 체크리스트 형식인지 검증
2. 서비스별 `./gradlew test` 가능 여부 확인
3. ArchUnit + JaCoCo 검증 실패 시 구현 착수 전 보정
