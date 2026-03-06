# Tasks: Frontend Usability Overhaul

**Input**: Design documents from `/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-surface-contract.md`, `quickstart.md`  
**Tests**: 포함 (spec.md의 User Scenarios, Success Criteria, quickstart 검증 플로우를 구현 수준으로 고정해야 함)  
**Organization**: Setup → Foundational → User Story별 독립 구현(US1~US7) → Polish

## Format: `[ID] [P?] [Story] Description`

- `[P]`: 병렬 가능 작업 (서로 다른 파일, 선행 의존성 없음)
- `[Story]`: 사용자 스토리 라벨 (`[US1]`~`[US7]`)
- 모든 태스크는 정확한 파일 경로를 포함

## Path Conventions

- Frontend app: `frontend/orbit-web/src/...`
- Frontend config: `frontend/orbit-web/...`
- API Gateway: `backend/orbit-platform/services/api-gateway/src/...`
- Feature docs: `specs/001-frontend-usability-overhaul/...`
- Contract tests: `tests/contract/...`
- Integration tests: `tests/integration/...`
- E2E tests: `tests/e2e/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: usability overhaul 전반에서 재사용할 공통 타입, 카피, 테스트 골격, 검증 문서를 준비한다.

- [ ] T001 Create shared usability feature barrel in `frontend/orbit-web/src/features/usability/index.ts`
- [ ] T002 Create product vocabulary and CTA hierarchy map in `frontend/orbit-web/src/features/usability/copy.ts`
- [ ] T003 [P] Create shared surface-state content helpers in `frontend/orbit-web/src/features/usability/surfaceContent.ts`
- [ ] T004 [P] Create AI state presentation helpers in `frontend/orbit-web/src/features/insights/aiStatePresentation.ts`
- [ ] T005 [P] Create shell/usability telemetry event definitions in `frontend/orbit-web/src/lib/telemetry/usabilityEvents.ts`
- [ ] T006 Create UI surface contract test scaffold in `tests/contract/us1-ui-surface-contract.test.ts`
- [ ] T007 [P] Create shared project-view integration test scaffold in `tests/integration/us1-project-view-context.test.ts`
- [ ] T008 [P] Create first-session/mobile E2E helper utilities in `tests/e2e/support/usability.ts`
- [ ] T009 Update manual validation checklist for this feature in `specs/001-frontend-usability-overhaul/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에서 공통으로 사용하는 shell, context, search, empty-state, gateway contract 기반을 고정한다.

**⚠️ CRITICAL**: 이 단계 완료 전 사용자 스토리 구현 시작 금지

- [ ] T010 Refactor route metadata and role-filter model in `frontend/orbit-web/src/app/navigationModel.ts`
- [ ] T011 Refactor shell layout slots and active-assist arbitration in `frontend/orbit-web/src/app/AppShell.tsx`
- [ ] T012 [P] Create route-purpose registry for page intent and primary CTA lookup in `frontend/orbit-web/src/app/routePurposeRegistry.ts`
- [ ] T013 Extend activation state model for first-session, returning, and recovery states in `frontend/orbit-web/src/features/activation/types.ts`
- [ ] T014 Extend activation store for resume target and workspace recommendation in `frontend/orbit-web/src/stores/activationStore.ts`
- [ ] T015 Extend shared project-view state for query, scope, and intent persistence in `frontend/orbit-web/src/stores/projectViewStore.ts`
- [ ] T016 [P] Create global search hook and result model in `frontend/orbit-web/src/features/search/hooks/useGlobalSearch.ts`
- [ ] T017 Create search endpoint adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SearchController.java`
- [ ] T018 [P] Create search aggregation service in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/SearchService.java`
- [ ] T019 [P] Create search controller gateway tests in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/adapters/in/web/SearchControllerTest.java`
- [ ] T020 Add shared empty, locked, fallback, and zero-result state registry rules in `frontend/orbit-web/src/features/activation/emptyStateRegistry.ts`
- [ ] T021 [P] Add shell and shared-context regression coverage in `frontend/orbit-web/src/app/AppShell.test.tsx`
- [ ] T022 [P] Add navigation semantics regression coverage in `frontend/orbit-web/src/app/navigationModel.test.ts`

**Checkpoint**: shell, search, shared context, and fallback state primitives are ready for story implementation.

---

## Phase 3: User Story 1 - First-Session Activation (Priority: P1) 🎯

**Goal**: 신규 사용자가 첫 진입 시 제품 목적과 다음 행동을 즉시 이해하고, 최소한의 프로필 정보만으로 workspace에 들어가 첫 의미 있는 행동을 완료하게 한다.

**Independent Test**: 새 계정 로그인 후 `/app` → `/app/workspace/select` 경로에서 외부 설명 없이 workspace 선택 및 첫 작업 생성/가져오기까지 2분 내 완료 가능.

### Tests for User Story 1

- [ ] T023 [P] [US1] Add first-session activation hero test in `frontend/orbit-web/src/pages/overview/OperationsHubPage.test.tsx`
- [ ] T024 [P] [US1] Add workspace scope-first entry test in `frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.test.tsx`
- [ ] T025 [P] [US1] Add first-session activation E2E scenario in `tests/e2e/us1-first-session-activation.spec.ts`

### Implementation for User Story 1

- [ ] T026 [US1] Refactor activation-first landing with one dominant primary action in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [ ] T027 [US1] Rebuild checklist to support first-session and resume-work variants in `frontend/orbit-web/src/components/activation/ActivationChecklist.tsx`
- [ ] T028 [US1] Make optional profile fields non-blocking and defer enrichment UI in `frontend/orbit-web/src/pages/onboarding/ProfileOnboardingPage.tsx`
- [ ] T029 [US1] Redesign workspace selection as scope-first flow in `frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- [ ] T030 [US1] Surface current workspace, role, and recommended next destination in `frontend/orbit-web/src/app/AppShell.tsx`
- [ ] T031 [US1] Wire activation resume-target loading into route bootstrap in `frontend/orbit-web/src/app/router.tsx`
- [ ] T032 [US1] Extend activation response DTO for workspace recommendation and gating state in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ActivationController.java`
- [ ] T033 [US1] Implement activation response composition for first-session and returning-user states in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ActivationService.java`
- [ ] T034 [US1] Emit activation and workspace-entry telemetry events in `frontend/orbit-web/src/lib/telemetry/usabilityEvents.ts`

**Checkpoint**: US1 완료 시 신규 사용자는 막히지 않고 첫 액션까지 진입할 수 있다.

---

## Phase 4: User Story 2 - Daily Execution on the Board (Priority: P1)

**Goal**: 보드가 일일 실행의 기본 화면으로 작동하고, 현재 scope/sprint 상태, 주요 작업, task detail의 우선순위가 한 번에 이해되게 만든다.

**Independent Test**: `/app/projects/board` 진입 후 task 생성, 선택, 상태 변경, no-sprint 상태 해석을 한 화면에서 수행 가능.

### Tests for User Story 2

- [ ] T035 [P] [US2] Add board first-viewport clarity test in `frontend/orbit-web/src/pages/projects/BoardPage.test.tsx`
- [ ] T036 [P] [US2] Add task inspector information-order test in `frontend/orbit-web/src/components/projects/WorkItemDetailPanel.test.tsx`
- [ ] T037 [P] [US2] Add board execution E2E scenario in `tests/e2e/us2-board-daily-execution.spec.ts`

### Implementation for User Story 2

- [ ] T038 [US2] Rebuild board hero, scope header, and primary CTA hierarchy in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [ ] T039 [US2] Reduce filter-bar density and progressive disclosure in `frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx`
- [ ] T040 [US2] Convert board side area into single-context create/detail/dependency mode in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [ ] T041 [US2] Reorder task detail content by decision value in `frontend/orbit-web/src/components/projects/WorkItemDetailPanel.tsx`
- [ ] T042 [US2] Move dependency inspection into a secondary contextual pattern in `frontend/orbit-web/src/components/projects/DependencyInspectorPanel.tsx`
- [ ] T043 [US2] Add instructional no-sprint, no-work, and filtered-empty states in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [ ] T044 [US2] Align board quick-create language and state emphasis with the shared vocabulary map in `frontend/orbit-web/src/features/workitems/display.ts`
- [ ] T045 [US2] Emit board execution telemetry for create/select/move flows in `frontend/orbit-web/src/lib/telemetry/usabilityEvents.ts`

**Checkpoint**: US2 완료 시 보드가 control cockpit이 아니라 명확한 실행 도구로 읽힌다.

---

## Phase 5: User Story 3 - Sprint Planning and DSU Review Loop (Priority: P1)

**Goal**: sprint planning과 DSU review를 하나의 loop 안에 있는 서로 다른 모드로 명확히 나누고, 제안은 항상 사람이 읽고 승인/거절하는 구조로 보이게 만든다.

**Independent Test**: `/app/sprint?mode=planning`에서 계획을 이해하고 `/app/sprint?mode=dsu`로 이동해 DSU 제출, suggestion 검토, 승인/거절까지 흐름이 명확해야 한다.

### Tests for User Story 3

- [ ] T046 [P] [US3] Add sprint mode separation test in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.test.tsx`
- [ ] T047 [P] [US3] Add DSU suggestion readability test in `frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.test.tsx`
- [ ] T048 [P] [US3] Add sprint-to-DSU approval E2E scenario in `tests/e2e/us3-sprint-dsu-loop.spec.ts`

### Implementation for User Story 3

- [ ] T049 [US3] Refactor sprint surface into explicit planning and DSU modes in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [ ] T050 [US3] Clarify sprint setup purpose, readiness, and handoff messaging in `frontend/orbit-web/src/components/agile/SprintWizardStepInfo.tsx`
- [ ] T051 [US3] Clarify backlog selection and freeze prerequisites in `frontend/orbit-web/src/components/agile/SprintWizardStepBacklog.tsx`
- [ ] T052 [US3] Redesign day-plan draft review and freeze explanation in `frontend/orbit-web/src/components/agile/SprintWizardStepDayPlan.tsx`
- [ ] T053 [US3] Refactor DSU composer around daily review purpose and blocking reasons in `frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
- [ ] T054 [US3] Replace raw suggestion payload rendering with human-readable review cards in `frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.tsx`
- [ ] T055 [US3] Create explicit sprint-mode state helpers in `frontend/orbit-web/src/features/agile/sprintMode.ts`
- [ ] T056 [US3] Extend sprint gateway payloads with prerequisite, freeze, and lock-state messaging in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- [ ] T057 [US3] Extend DSU suggestion composition with rationale, confidence, and pending decision fields in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/DsuSuggestionService.java`
- [ ] T058 [US3] Add sprint and DSU gateway tests for blocked and pending states in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/adapters/in/web/SprintControllerTest.java`

**Checkpoint**: US3 완료 시 planning과 review가 혼재되지 않고, 승인 전 변경이 적용된 것처럼 보이지 않는다.

---

## Phase 6: User Story 4 - Trustworthy Schedule Intelligence (Priority: P1)

**Goal**: Schedule Intelligence가 live telemetry와 scenario editing을 명확히 구분하고, AI guidance를 confidence/evidence/draft 상태와 함께 설명 가능하게 만든다.

**Independent Test**: `/app/insights`에서 evaluation 실행 후 현재 화면이 live인지 scenario인지, 결과가 draft인지 applied인지, fallback인지 정상 평가인지 명확히 구분 가능해야 한다.

### Tests for User Story 4

- [ ] T059 [P] [US4] Add live-versus-scenario rendering test in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.test.tsx`
- [ ] T060 [P] [US4] Add dashboard metric semantics test in `frontend/orbit-web/src/pages/projects/DashboardPage.test.tsx`
- [ ] T061 [P] [US4] Add schedule-intelligence trust E2E scenario in `tests/e2e/us4-schedule-intelligence-trust.spec.ts`

### Implementation for User Story 4

- [ ] T062 [US4] Split live mode and scenario mode in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [ ] T063 [US4] Standardize AI guidance labels, confidence bands, and fallback states in `frontend/orbit-web/src/features/insights/aiGuidanceStatus.ts`
- [ ] T064 [US4] Refactor coaching summary surface to use draft/evidence/confidence contract in `frontend/orbit-web/src/components/insights/AICoachPanel.tsx`
- [ ] T065 [US4] Limit floating agent to one explicit contextual entry pattern in `frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`
- [ ] T066 [US4] Correct dashboard metric semantics, freshness, and zero-result drilldowns in `frontend/orbit-web/src/pages/projects/DashboardPage.tsx`
- [ ] T067 [US4] Add metric drilldown mapping helpers in `frontend/orbit-web/src/features/insights/drilldownContracts.ts`
- [ ] T068 [US4] Extend evaluation response with live/scenario, confidence, reason, and drilldown metadata in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [ ] T069 [US4] Persist and return evaluation provenance and fallback state in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ScheduleEvaluationHistoryService.java`
- [ ] T070 [US4] Add contract coverage for evaluation semantics and fallback messaging in `tests/contract/us4-schedule-intelligence.contract.test.ts`

**Checkpoint**: US4 완료 시 intelligence surface는 숫자와 AI 설명을 믿고 검토할 수 있는 상태가 된다.

---

## Phase 7: User Story 5 - Triage and Collaboration (Priority: P2)

**Goal**: Inbox와 Thread를 bare notification/feed가 아니라 triage 도구로 바꾸고, source context와 next action을 빠르게 이해하게 만든다.

**Independent Test**: `/app/inbox`에서 항목을 보고 urgency와 source를 이해하고, thread나 work item으로 이동 후 resolve 상태까지 명확히 처리 가능.

### Tests for User Story 5

- [ ] T071 [P] [US5] Add inbox triage card context test in `frontend/orbit-web/src/pages/inbox/InboxPage.test.tsx`
- [ ] T072 [P] [US5] Add thread context header test in `frontend/orbit-web/src/components/collaboration/ThreadPanel.test.tsx`
- [ ] T073 [P] [US5] Add inbox triage E2E scenario in `tests/e2e/us5-inbox-triage.spec.ts`

### Implementation for User Story 5

- [ ] T074 [US5] Redesign inbox list hierarchy around urgency, source, and next action in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [ ] T075 [US5] Refactor inbox filters around triage states and action buckets in `frontend/orbit-web/src/components/collaboration/InboxFilterBar.tsx`
- [ ] T076 [US5] Rebuild thread panel context header, source summary, and next-action framing in `frontend/orbit-web/src/components/collaboration/ThreadPanel.tsx`
- [ ] T077 [US5] Create inbox preview and deep-link presentation mapper in `frontend/orbit-web/src/features/collaboration/inboxPresentation.ts`
- [ ] T078 [US5] Extend inbox payloads with preview, urgency, and source summary in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/NotificationController.java`
- [ ] T079 [US5] Extend thread payloads with source object and resolution context in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java`
- [ ] T080 [US5] Add gateway tests for triage resolution and thread context in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/adapters/in/web/ThreadControllerTest.java`

**Checkpoint**: US5 완료 시 inbox는 클릭 전에도 판단 가능한 triage surface가 된다.

---

## Phase 8: User Story 6 - Consistent Multi-View Work Management (Priority: P2)

**Goal**: board, table, timeline, calendar, dashboard가 같은 work collection의 다른 표현이라는 점을 유지하고, 모바일에서도 핵심 흐름이 깨지지 않게 만든다.

**Independent Test**: board에서 설정한 query/scope/filter가 table, timeline, calendar, dashboard로 전환해도 유지되고, 360px/390px 폭에서도 page-level horizontal scrolling 없이 주요 액션 접근 가능.

### Tests for User Story 6

- [ ] T081 [P] [US6] Add shared filter continuity integration test in `tests/integration/us6-shared-view-context.test.ts`
- [ ] T082 [P] [US6] Add mobile no-horizontal-scroll E2E scenario in `tests/e2e/us6-mobile-view-consistency.spec.ts`
- [ ] T083 [P] [US6] Add project view-tab context preservation test in `frontend/orbit-web/src/components/projects/ProjectViewTabs.test.tsx`

### Implementation for User Story 6

- [ ] T084 [US6] Align project view tabs with shared context and clear view-intent labels in `frontend/orbit-web/src/components/projects/ProjectViewTabs.tsx`
- [ ] T085 [US6] Refactor table surface toward structured review and selection state in `frontend/orbit-web/src/pages/projects/TablePage.tsx`
- [ ] T086 [US6] Refactor timeline surface toward schedule-planning semantics in `frontend/orbit-web/src/pages/projects/TimelinePage.tsx`
- [ ] T087 [US6] Refactor calendar surface toward scheduling and unscheduled-work management in `frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- [ ] T088 [US6] Preserve project-view query, scope, and drilldown context in `frontend/orbit-web/src/stores/projectViewStore.ts`
- [ ] T089 [US6] Add dashboard drilldown continuity and zero-result behavior in `frontend/orbit-web/src/pages/projects/DashboardPage.tsx`
- [ ] T090 [US6] Extend project-view gateway responses with stable filter and scope payloads in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ProjectViewController.java`
- [ ] T091 [US6] Add gateway tests for context continuity and drilldown alignment in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/adapters/in/web/ProjectViewControllerTest.java`

**Checkpoint**: US6 완료 시 multi-view 전환이 separate tool hopping처럼 느껴지지 않는다.

---

## Phase 9: User Story 7 - Language and Design Consistency (Priority: P3)

**Goal**: 제품 전반의 vocabulary, CTA hierarchy, empty/loading/locked/fallback copy, 디자인 토큰과 표면 역할을 일관되게 맞춘다.

**Independent Test**: activation, board, sprint, inbox, insights를 순회해도 용어와 action hierarchy를 다시 배울 필요가 없어야 한다.

### Tests for User Story 7

- [ ] T092 [P] [US7] Add vocabulary consistency snapshot coverage in `frontend/orbit-web/src/app/AppShell.test.tsx`
- [ ] T093 [P] [US7] Add empty, locked, and fallback copy test in `frontend/orbit-web/src/components/common/EmptyStateCard.test.tsx`
- [ ] T094 [P] [US7] Add 360px visual-hierarchy E2E regression scenario in `tests/e2e/us7-language-design-consistency.spec.ts`

### Implementation for User Story 7

- [ ] T095 [US7] Finalize shared vocabulary constants and label helpers in `frontend/orbit-web/src/features/usability/copy.ts`
- [ ] T096 [US7] Apply consistent shell and workspace labels in `frontend/orbit-web/src/app/AppShell.tsx`
- [ ] T097 [US7] Apply activation and empty-state language consistency in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [ ] T098 [US7] Apply board and task-action language consistency in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [ ] T099 [US7] Apply sprint and DSU guidance copy consistency in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [ ] T100 [US7] Apply insights and AI wording consistency in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [ ] T101 [US7] Apply inbox and triage wording consistency in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [ ] T102 [US7] Rebalance action hierarchy and focus treatment in `frontend/orbit-web/src/design/primitives.css`
- [ ] T103 [US7] Differentiate surface roles and reduce generic wrapper styling in `frontend/orbit-web/src/design/layout.css`
- [ ] T104 [US7] Normalize semantic tokens for scope, action, and AI states in `frontend/orbit-web/src/design/tokens.css`

**Checkpoint**: US7 완료 시 인터페이스가 구현 흔적보다 제품 규칙으로 읽히기 시작한다.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 회귀 방지, 모바일 검증, release evidence를 마무리한다.

- [ ] T105 [P] Add Playwright mobile/usability project matrix in `tests/e2e/playwright.config.ts`
- [ ] T106 [P] Add frontend regression scripts for usability suite in `frontend/orbit-web/package.json`
- [ ] T107 Add contract snapshot coverage for empty, blocked, fallback, and drilldown states in `tests/contract/us1-usability-snapshots.test.ts`
- [ ] T108 [P] Add integration smoke coverage for resume-work and zero-result drilldowns in `tests/integration/us1-usability-regressions.test.ts`
- [ ] T109 Update final acceptance evidence checklist in `specs/001-frontend-usability-overhaul/checklists/requirements.md`
- [ ] T110 Update rollout and manual validation matrix in `specs/001-frontend-usability-overhaul/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작, 모든 사용자 스토리의 선행조건
- **Phase 3~9 (User Stories)**: Phase 2 완료 후 시작 가능
- **Phase 10 (Polish)**: 원하는 사용자 스토리 구현 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: Foundational 완료 후 바로 시작 가능, activation과 resume-work의 MVP 핵심
- **US2 (P1)**: Foundational 완료 후 시작 가능, US1과 병렬 가능하지만 board CTA 언어는 US7의 vocabulary map을 재사용함
- **US3 (P1)**: Foundational 완료 후 시작 가능, US2와 병렬 가능하지만 sprint/DSU handoff 설명은 shell copy 규칙과 일관되게 유지해야 함
- **US4 (P1)**: Foundational 완료 후 시작 가능, dashboard semantics와 insights trust를 함께 다루므로 US6와 연결되지만 독립 검증 가능
- **US5 (P2)**: Foundational 완료 후 시작 가능, inbox/thread payload 확장은 다른 스토리와 독립적
- **US6 (P2)**: Foundational 완료 후 시작 가능, US2/US4 이후 검증이 쉬우나 기술적으로는 병렬 구현 가능
- **US7 (P3)**: 모든 주요 surface가 어느 정도 안정된 뒤 수행하는 것이 효율적이지만, shared vocabulary file(T095)은 앞당겨도 됨

### Recommended Completion Order

1. Setup + Foundational
2. US1 First-Session Activation
3. US2 Daily Execution on the Board
4. US3 Sprint Planning and DSU Review Loop
5. US4 Trustworthy Schedule Intelligence
6. US5 Triage and Collaboration
7. US6 Consistent Multi-View Work Management
8. US7 Language and Design Consistency
9. Polish

---

## Parallel Execution Examples

### Parallel Example: Setup

```bash
T003 + T004 + T005 병렬 수행
T007 + T008 병렬 수행
```

### Parallel Example: US1

```bash
T023 + T024 + T025 병렬 수행
T032 + T033 병렬 수행
```

### Parallel Example: US2

```bash
T035 + T036 + T037 병렬 수행
T041 + T042 + T045 병렬 수행
```

### Parallel Example: US3

```bash
T046 + T047 + T048 병렬 수행
T055 + T056 + T057 병렬 수행
```

### Parallel Example: US4

```bash
T059 + T060 + T061 병렬 수행
T067 + T068 + T069 병렬 수행
```

### Parallel Example: US5

```bash
T071 + T072 + T073 병렬 수행
T078 + T079 + T080 병렬 수행
```

### Parallel Example: US6

```bash
T081 + T082 + T083 병렬 수행
T085 + T086 + T087 병렬 수행
```

### Parallel Example: US7

```bash
T092 + T093 + T094 병렬 수행
T102 + T103 + T104 병렬 수행
```

---

## Implementation Strategy

### Recommended MVP Scope

이 feature의 실질적 MVP는 **US1 + US2 + US3**이다.

이 조합이면 다음을 한 번에 해결할 수 있다.
- 첫 진입에서 무엇을 해야 하는지 모르는 문제
- 메인 보드가 실행 surface가 아니라 control cockpit처럼 보이는 문제
- sprint와 DSU가 왜 함께 있고 어떻게 써야 하는지 모르는 문제

### Incremental Delivery

1. **Setup + Foundational** 완료 후 shell/context/search/empty-state primitives를 고정한다.
2. **US1**으로 activation과 workspace entry를 안정화한다.
3. **US2**로 board 실행 경험을 재구성한다.
4. **US3**으로 sprint ↔ DSU loop를 명확히 만든다.
5. **US4**로 insights/dashboard 신뢰도를 회복한다.
6. **US5**로 inbox/thread triage를 실사용 가능 상태로 만든다.
7. **US6**로 multi-view continuity와 모바일 resilience를 보강한다.
8. **US7**로 언어와 디자인 규칙을 전체 surface에 일괄 정리한다.
9. **Polish**로 회귀와 release evidence를 마감한다.

### Parallel Team Strategy

여러 명이 동시에 작업한다면 다음 분리가 가장 안전하다.

1. 한 명은 **Foundational + US1**
2. 한 명은 **US2 + US6**
3. 한 명은 **US3 + US5**
4. 한 명은 **US4 + US7 + Polish**

단, `AppShell.tsx`, `navigationModel.ts`, `projectViewStore.ts`, `tokens.css`, `primitives.css`, `layout.css`는 충돌 가능성이 높으므로 병렬 작업 전에 소유자를 명확히 정해야 한다.

---

## Notes

- 모든 태스크는 구현 가능한 파일 단위로 쪼개져 있다.
- `[P]`는 서로 다른 파일 또는 독립 테스트로 병렬 수행 가능한 작업만 표시했다.
- 사용자 스토리별 독립 테스트 기준을 먼저 통과시키고 다음 스토리로 넘어가는 방식이 가장 안전하다.
- `001-*` spec prefix 충돌 경고가 있으므로 이후 자동화 스크립트 사용 시 현재 feature 디렉터리(`/home/lhs/dev/tasks/specs/001-frontend-usability-overhaul/`)를 명시적으로 확인해야 한다.
