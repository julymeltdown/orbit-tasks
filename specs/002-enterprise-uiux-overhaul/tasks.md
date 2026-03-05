# Tasks: Orbit Tasks UI/UX + 기능 + API/아키텍처 동시 개편

**Input**: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/plan.md` + `spec.md`  
**Prerequisites**: `plan.md`, `spec.md`, `contracts/gateway-uiux.openapi.yaml`  
**Tests**: 포함 (Frontend + Backend + Contract + Integration + E2E)  
**Organization**: Setup → Foundational → User Story별 독립 구현 → Polish

## Format: `[ID] [P?] [Story] Description`

- `[P]`: 병렬 가능
- `[Story]`: `[US1]..[US9]`
- 모든 태스크는 정확한 파일 경로 포함

## Path Conventions

- Frontend: `frontend/orbit-web/src/...`
- API Gateway: `backend/orbit-platform/services/api-gateway/src/...`
- Domain services: `backend/orbit-platform/services/<service>/src/...`
- Cross-tests: `tests/contract`, `tests/integration`, `tests/e2e`

---

## Phase 1: Setup (Shared Contracts & Types)

**Purpose**: v2 인터페이스/타입/오류코드 기준선 고정

- [X] T001 Update canonical v2 contract in `specs/002-enterprise-uiux-overhaul/contracts/gateway-uiux.openapi.yaml`
- [X] T002 Align gateway route map to v2 contract in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/route-contracts.yml`
- [X] T003 [P] Align aggregation recipes to v2 route keys in `backend/orbit-platform/services/api-gateway/src/main/resources/contracts/aggregation-recipes.yml`
- [X] T004 Define frontend v2 domain models in `frontend/orbit-web/src/features/workitems/types.ts`
- [X] T005 [P] Add shared API error code map in `frontend/orbit-web/src/lib/http/errorCodes.ts`
- [X] T006 [P] Add gateway error code enum and mapper in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/RestExceptionHandler.java`
- [ ] T007 Create v2 contract snapshot tests in `tests/contract/v2-api-contract.schema.test.ts`
- [ ] T008 Document v2 migration rules in `specs/002-enterprise-uiux-overhaul/quickstart.md`

---

## Phase 2: Foundational (Gateway Delegation & Persistence Baseline)

**Purpose**: Gateway 인메모리 제거 준비와 서비스 위임 공통 기반 완성

**⚠️ CRITICAL**: 이 단계 완료 전 Sprint-DSU/AI 본 구현 착수 금지

- [ ] T009 Create gateway orchestration port for workgraph in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/WorkgraphClientPort.java`
- [ ] T010 [P] Create gateway orchestration port for agile ops in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/AgileOpsClientPort.java`
- [ ] T011 [P] Create gateway orchestration port for collaboration in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/CollaborationClientPort.java`
- [ ] T012 [P] Create gateway orchestration port for schedule intelligence in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/ScheduleIntelligenceClientPort.java`
- [ ] T013 [P] Create gateway orchestration port for team service in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/TeamClientPort.java`
- [ ] T014 Implement workgraph grpc adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/grpc/WorkgraphClient.java`
- [ ] T015 [P] Implement agile ops grpc adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/grpc/AgileOpsClient.java`
- [ ] T016 [P] Implement collaboration grpc adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/grpc/CollaborationClient.java`
- [ ] T017 [P] Implement schedule intelligence grpc adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/grpc/ScheduleIntelligenceClient.java`
- [ ] T018 [P] Implement team grpc adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/grpc/TeamClient.java`
- [ ] T019 Add gateway v2 orchestration service for work items in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/WorkItemGatewayServiceV2.java`
- [ ] T020 [P] Add gateway v2 orchestration service for sprint/dsu in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/SprintGatewayServiceV2.java`
- [ ] T021 [P] Add gateway v2 orchestration service for collaboration/inbox in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/CollaborationGatewayServiceV2.java`
- [ ] T022 [P] Add gateway v2 orchestration service for evaluation in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ScheduleEvaluationGatewayServiceV2.java`
- [ ] T023 [P] Add gateway v2 orchestration service for team in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/TeamGatewayServiceV2.java`
- [ ] T024 Add migration for `day_plan` and `day_plan_item` in `backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V3__day_plan.sql`
- [ ] T025 [P] Add migration for `dsu_entry`, `dsu_suggestion`, `dsu_apply_log` in `backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V4__dsu_suggestion_apply.sql`
- [ ] T026 [P] Add migration for `work_item_activity` in `backend/orbit-platform/services/workgraph-service/src/main/resources/db/migration/V3__work_item_activity.sql`
- [ ] T027 [P] Add migration for `inbox_item` extension in `backend/orbit-platform/services/collaboration-service/src/main/resources/db/migration/V3__inbox_item_extension.sql`
- [ ] T028 [P] Add migration for `schedule_evaluation` extension in `backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/db/migration/V3__schedule_evaluation_extension.sql`
- [ ] T029 Add foundational integration test for gateway delegation paths in `tests/integration/v2-gateway-delegation.foundation.test.ts`

**Checkpoint**: Gateway가 상태를 보유하지 않고 v2 위임 구조가 준비됨

---

## Phase 3: User Story 1 - 명확한 내비게이션 계층으로 진입 (Priority: P1)

**Goal**: Scope 내비와 View 전환의 책임을 분리하고 중복 액션 제거

**Independent Test**: 로그인 후 3클릭 이내 프로젝트 진입 + 뷰 전환 시 문맥 유지

### Tests for User Story 1

- [ ] T030 [P] [US1] Add shell navigation contract test in `tests/contract/us1-shell-scope-view.contract.test.ts`
- [ ] T031 [P] [US1] Add routing context integration test in `tests/integration/us1-routing-context.test.ts`
- [ ] T032 [P] [US1] Add e2e navigation journey test in `tests/e2e/us1-scope-view-navigation.spec.ts`

### Implementation for User Story 1

- [ ] T033 [US1] Simplify top action set and remove duplicate entry actions in `frontend/orbit-web/src/app/AppShell.tsx`
- [ ] T034 [US1] Normalize scope navigation model in `frontend/orbit-web/src/app/navigationModel.ts`
- [ ] T035 [US1] Enforce scope-first routes and redirects in `frontend/orbit-web/src/app/router.tsx`
- [X] T036 [US1] Remove workspace UUID rendering and show human labels in `frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- [X] T037 [US1] Remove project token/UUID exposure in operations hub in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [ ] T038 [US1] Add compact navigation density rules for desktop/mobile in `frontend/orbit-web/src/design/layout.css`

---

## Phase 4: User Story 2 - Work Item 멀티뷰 일관성 확보 (Priority: P1)

**Goal**: Board/Table/Timeline/Calendar/Dashboard를 동일 데이터셋 기반으로 정렬하고 CRUD 편차 제거

**Independent Test**: 한 항목 수정이 5개 뷰에서 일관되게 반영

### Tests for User Story 2

- [ ] T039 [P] [US2] Add work-item v2 contract test in `tests/contract/us2-workitem-v2.contract.test.ts`
- [ ] T040 [P] [US2] Add multiview parity integration test in `tests/integration/us2-multiview-parity-v2.test.ts`
- [ ] T041 [P] [US2] Add e2e board-table-calendar consistency test in `tests/e2e/us2-multiview-consistency.spec.ts`

### Implementation for User Story 2

- [X] T042 [US2] Expand work-item domain type fields in `frontend/orbit-web/src/features/workitems/types.ts`
- [X] T043 [US2] Migrate work item hook to `/api/v2/work-items` endpoints in `frontend/orbit-web/src/features/workitems/hooks/useWorkItems.ts`
- [X] T044 [US2] Add work-item patch API for content/estimate/due fields in `frontend/orbit-web/src/features/workitems/hooks/useWorkItems.ts`
- [X] T045 [US2] Refactor board to 2-pane execution layout in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T046 [US2] Create work-item detail side panel component in `frontend/orbit-web/src/components/projects/WorkItemDetailPanel.tsx`
- [X] T047 [US2] Wire board detail edits (title/assignee/priority/due/markdown) in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T048 [US2] Add activity timeline rendering to detail panel in `frontend/orbit-web/src/components/projects/WorkItemDetailPanel.tsx`
- [X] T049 [US2] Add table inline edit fields beyond status in `frontend/orbit-web/src/pages/projects/TablePage.tsx`
- [X] T050 [US2] Add timeline date editing controls in `frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [X] T051 [US2] Add calendar drag/date change update handler in `frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- [X] T052 [US2] Add dashboard drill-down actions into board/table filters in `frontend/orbit-web/src/pages/projects/DashboardPage.tsx`
- [X] T053 [US2] Replace gateway work-item controller with service delegation in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`
- [ ] T054 [US2] Add work-item CRUD + activity gRPC facade in `backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/adapters/in/grpc/WorkgraphGrpcService.java`
- [ ] T055 [US2] Add work-item activity domain service in `backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/application/service/WorkItemActivityService.java`

---

## Phase 5: User Story 3 - 보드 조작과 고급 기능 분리 + Sprint Wizard (Priority: P1)

**Goal**: 실행 중심 보드 + Sprint 3-Step Wizard + Day Plan Draft/Freeze

**Independent Test**: Sprint 생성→Backlog 선택→AI Day Plan Draft→편집→Freeze 완료

### Tests for User Story 3

- [ ] T056 [P] [US3] Add sprint day-plan v2 contract test in `tests/contract/us3-sprint-dayplan-v2.contract.test.ts`
- [ ] T057 [P] [US3] Add sprint wizard integration test in `tests/integration/us3-sprint-wizard.test.ts`
- [ ] T058 [P] [US3] Add e2e sprint freeze flow test in `tests/e2e/us3-sprint-freeze.spec.ts`

### Implementation for User Story 3

- [X] T059 [US3] Replace sprint workspace with 3-step wizard shell in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [X] T060 [US3] Create sprint wizard step components in `frontend/orbit-web/src/components/agile/SprintWizardStepInfo.tsx`
- [X] T061 [P] [US3] Create backlog selection step in `frontend/orbit-web/src/components/agile/SprintWizardStepBacklog.tsx`
- [X] T062 [P] [US3] Create day-plan draft/freeze step in `frontend/orbit-web/src/components/agile/SprintWizardStepDayPlan.tsx`
- [X] T063 [US3] Add sprint/day-plan hooks for v2 APIs in `frontend/orbit-web/src/features/agile/hooks/useSprintPlanning.ts`
- [X] T064 [US3] Add board sprint-only bridge and freeze badge in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T065 [US3] Replace gateway sprint controller with v2 delegation endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [ ] T066 [US3] Implement day plan generation use case in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DayPlanGenerationService.java`
- [ ] T067 [US3] Implement day plan edit/freeze use case in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DayPlanFreezeService.java`
- [ ] T068 [US3] Add agile ops gRPC operations for day plan lifecycle in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/adapters/in/grpc/AgileOpsGrpcService.java`

---

## Phase 6: User Story 4 - DSU 실행 루프 + Suggest/Apply 컨펌 정책 (Priority: P1)

**Goal**: DSU 원문 저장과 AI 변경 제안을 분리하고 승인 항목만 원자 반영

**Independent Test**: DSU 제출→Suggest→부분 승인→Apply 시 승인 항목만 반영

### Tests for User Story 4

- [ ] T069 [P] [US4] Add dsu suggest/apply contract test in `tests/contract/us4-dsu-suggest-apply.contract.test.ts`
- [ ] T070 [P] [US4] Add dsu apply atomicity integration test in `tests/integration/us4-dsu-apply-atomicity.test.ts`
- [ ] T071 [P] [US4] Add e2e dsu confirm-only apply test in `tests/e2e/us4-dsu-confirm-apply.spec.ts`

### Implementation for User Story 4

- [X] T072 [US4] Refactor DSU composer to template + submit metadata in `frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
- [X] T073 [US4] Add DSU suggestion review panel in `frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.tsx`
- [X] T074 [US4] Integrate DSU suggest/apply flow into sprint page in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [X] T075 [US4] Add DSU suggestion hooks in `frontend/orbit-web/src/features/agile/hooks/useDsuSuggestions.ts`
- [X] T076 [US4] Replace DSU endpoints with `/api/v2/dsu*` in gateway controller `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [ ] T077 [US4] Implement DSU suggestion service in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DSUSuggestionService.java`
- [ ] T078 [US4] Implement DSU apply transaction service in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/application/service/DSUApplyService.java`
- [ ] T079 [US4] Persist DSU suggestion/apply audit records in `backend/orbit-platform/services/agile-ops-service/src/main/java/com/orbit/agile/adapters/out/persistence/DsuSuggestionRepository.java`

---

## Phase 7: User Story 5 - Inbox/Thread/Triage + Team Invite (Priority: P1)

**Goal**: 협업 triage 중심 UX와 v2 inbox/thread/team API 정렬

**Independent Test**: 멘션 생성→인박스 탭 분류→resolve→원본 딥링크 이동

### Tests for User Story 5

- [ ] T080 [P] [US5] Add inbox/thread/team v2 contract test in `tests/contract/us5-collab-team-v2.contract.test.ts`
- [ ] T081 [P] [US5] Add inbox resolve integration test in `tests/integration/us5-inbox-resolve.test.ts`
- [ ] T082 [P] [US5] Add e2e mention-to-inbox flow test in `tests/e2e/us5-mention-inbox.spec.ts`

### Implementation for User Story 5

- [X] T083 [US5] Refactor inbox tabs to Notifications/Requests/Mentions/AI Questions in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T084 [US5] Replace inbox row actions with unified patch endpoint in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T085 [US5] Remove thread/message ID truncation from inbox rows in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T086 [US5] Update thread panel to v2 thread/message APIs in `frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`
- [X] T087 [US5] Add team invite by email/handle UX and validation in `frontend/orbit-web/src/pages/team/TeamManagementPage.tsx`
- [X] T088 [US5] Replace collaboration controller with v2 delegated endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java`
- [X] T089 [US5] Replace team controller with v2 delegated endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/TeamController.java`
- [ ] T090 [US5] Implement inbox status patch use case in `backend/orbit-platform/services/collaboration-service/src/main/java/com/orbit/collaboration/application/service/InboxService.java`
- [ ] T091 [US5] Implement invite workflow use case in `backend/orbit-platform/services/team-service/src/main/java/com/orbit/team/application/service/TeamInvitationService.java`

---

## Phase 8: User Story 7 - AI 코치 및 평가 파이프라인 강건화 (Priority: P1)

**Goal**: 컨텍스트 기반 코치 + strict schema + fallback + confirmable actions

**Independent Test**: 평가 실행 시 정상/실패/저신뢰 분기와 액션 처리 검증

### Tests for User Story 7

- [ ] T092 [P] [US7] Add evaluation v2 contract test in `tests/contract/us7-evaluation-v2.contract.test.ts`
- [ ] T093 [P] [US7] Add low-confidence fallback integration test in `tests/integration/us7-low-confidence-fallback.test.ts`
- [ ] T094 [P] [US7] Add e2e floating coach context test in `tests/e2e/us7-floating-coach-context.spec.ts`

### Implementation for User Story 7

- [X] T095 [US7] Keep single floating launcher and simplify coach surfaces in `frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`
- [X] T096 [US7] Bind coach context to project/sprint/selection state in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [X] T097 [US7] Add draft action queue UI in `frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- [X] T098 [US7] Replace gateway evaluation controller with v2 delegation in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [ ] T099 [US7] Upgrade OpenAI call to strict schema response format in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/adapters/out/llm/OpenAiEvaluationClient.java`
- [ ] T100 [US7] Enforce `store:false` default and masking policy in `backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/application.yml`
- [ ] T101 [US7] Add confidence gate + action state machine in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/ScheduleEvaluationService.java`
- [ ] T102 [US7] Expand schema validator to strict field/type checks in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/EvaluationSchemaValidator.java`

---

## Phase 9: User Story 8 - 모바일/A11y/반응형 안정화 (Priority: P1)

**Goal**: iPhone 12 mini / 15 Pro 기준 메뉴 접근, 오버플로우 제로, 포커스 가림 제거

**Independent Test**: 모바일/키보드-only로 주요 루프 완주 가능

### Tests for User Story 8

- [ ] T103 [P] [US8] Add iPhone 12 mini viewport e2e scenario in `tests/e2e/us8-iphone12mini-layout.spec.ts`
- [ ] T104 [P] [US8] Add iPhone 15 Pro viewport e2e scenario in `tests/e2e/us8-iphone15pro-layout.spec.ts`
- [ ] T105 [P] [US8] Add focus-not-obscured e2e scenario in `tests/e2e/us8-focus-obscured.spec.ts`
- [ ] T106 [P] [US8] Add board horizontal scroll integration test in `tests/integration/us8-board-horizontal-scroll.test.ts`

### Implementation for User Story 8

- [ ] T107 [US8] Refine mobile menu trigger visibility and touch target sizing in `frontend/orbit-web/src/app/AppShell.tsx`
- [ ] T108 [US8] Convert hard pixel widths to responsive units in board layout CSS `frontend/orbit-web/src/design/layout.css`
- [ ] T109 [US8] Improve timeline/table overflow containers and affordance labels in `frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [ ] T110 [US8] Harden calendar unscheduled panel responsive behavior in `frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- [ ] T111 [US8] Add aria-live/status labels for drag/keyboard status moves in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`

---

## Phase 10: User Story 6/9 및 Cross-Cutting Polish (Priority: P2)

**Goal**: 포트폴리오/거버넌스 보정 + 릴리스 품질 게이트 완료

### Tests for User Story 6/9 and Polish

- [ ] T112 [P] [US6] Add portfolio v2 contract test in `tests/contract/us6-portfolio-v2.contract.test.ts`
- [ ] T113 [P] [US9] Add governance access integration test in `tests/integration/us9-governance-access.test.ts`
- [ ] T114 [P] Add end-to-end core loop scenario test in `tests/e2e/core-sprint-dsu-loop.spec.ts`

### Implementation for User Story 6/9 and Polish

- [ ] T115 [US6] Replace portfolio overview API calls to v2 and remove synthetic project payload in `frontend/orbit-web/src/pages/portfolio/PortfolioOverviewPage.tsx`
- [ ] T116 [US6] Replace gateway portfolio controller with delegated v2 endpoints in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/PortfolioController.java`
- [ ] T117 [US9] Align admin policy/evidence screens with new error codes in `frontend/orbit-web/src/pages/admin/ComplianceDashboardPage.tsx`
- [ ] T118 [US9] Align governance policy endpoints with v2 contract in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/GovernanceAdminController.java`
- [ ] T119 Add REST→gRPC mapping documentation in `backend/orbit-platform/docs/gateway-v2-service-mapping.md`
- [ ] T120 [P] Remove remaining UUID truncation in UI copy surfaces in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [ ] T121 [P] Remove remaining raw work-item ID rendering in sprint backlog list in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [ ] T122 Run and update frontend test baseline in `frontend/orbit-web/src/**/*.test.tsx`
- [ ] T123 Run and update backend service tests for touched services in `backend/orbit-platform/services/*/src/test/java/**`
- [ ] T124 Run and update contract/integration/e2e test fixtures in `tests/contract`, `tests/integration`, `tests/e2e`
- [ ] T125 Finalize release verification checklist in `specs/002-enterprise-uiux-overhaul/release-readiness-checklist.md`
- [ ] T126 [US2] Implement `DELETE /api/v2/dependencies/{id}` endpoint and mapper in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`
- [ ] T127 [US2] Implement dependency delete use case in `backend/orbit-platform/services/workgraph-service/src/main/java/com/orbit/workgraph/application/service/DependencyLifecycleService.java`
- [ ] T128 [US3] Implement `PATCH /api/v2/day-plans/{id}` endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [ ] T129 [US3] Implement `POST /api/v2/sprints/{id}:freeze` endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [ ] T130 [US7] Implement `POST /api/v2/insights/evaluations/{id}/actions` endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [ ] T131 [US7] Persist evaluation action audit trail in `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/EvaluationActionService.java`
- [ ] T132 [US5] Implement `PATCH /api/v2/inbox/{id}` read/resolve action endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java`
- [ ] T133 [US5] Implement `POST /api/v2/teams/{id}/invites` endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/TeamController.java`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → Phase 2 → Phase 3~9 → Phase 10
- Phase 2 완료 전 Sprint/DSU/AI 핵심 구현 시작 금지

### Story Dependencies

- US1/US2는 병렬 가능하나 v2 타입/오류코드(T001~T008) 완료 필요
- US3(스프린트) 완료 후 US4(DSU suggest/apply) 진행 권장
- US5 협업은 US2 work-item 문맥 연결 후 진행
- US7 AI는 US3/US4 데이터 흐름 안정화 후 진행
- US8 모바일은 각 스토리 구현과 병행 가능하지만 최종 회귀는 Phase 10에서 일괄

### MVP Scope (권장)

1. Phase 1 + 2 완료
2. US3 + US4 + US7 최소 동작 완성
3. US2의 Board 실행/상세 편집까지 포함

---

## Parallel Execution Examples

### Example A: Foundational 병렬

- T010, T011, T012, T013
- T015, T016, T017, T018
- T024, T025, T026, T027, T028

### Example B: Sprint-DSU 루프 병렬

- UI: T060, T061, T062
- Backend: T066, T067, T068
- DSU: T073, T075, T077, T078

### Example C: AI 강건화 병렬

- Front: T095, T096, T097
- Back: T099, T100, T101, T102

---

## Implementation Strategy

### Step 1: Contract-first

- v2 OpenAPI/route-contract 고정 후 타입/클라이언트 일괄 전환

### Step 2: P0 Loop-first

- Sprint Wizard + DSU Confirm Apply + AI fallback 우선 제공

### Step 3: Delegation-first

- Gateway 인메모리 상태를 순차 제거하며 서비스 위임 완성

### Step 4: Hardening

- 모바일/A11y/성능/회귀 테스트를 통과하고 릴리스
