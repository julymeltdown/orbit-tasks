# Tasks: Activation-First UI/UX Overhaul for Orbit Tasks

**Input**: Design documents from `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/activation-flow.openapi.yaml`, `quickstart.md`  
**Tests**: 포함 (spec.md에 User Scenarios & Testing 및 성공 기준 검증 요구가 명시됨)  
**Organization**: Setup → Foundational → User Story별 독립 구현(US1~US5) → Polish

## Format: `[ID] [P?] [Story] Description`

- `[P]`: 병렬 가능 작업 (서로 다른 파일/선행의존 없음)
- `[Story]`: 사용자 스토리 라벨 (`[US1]`~`[US5]`)
- 모든 태스크는 정확한 파일 경로를 포함

## Path Conventions

- Frontend: `frontend/orbit-web/src/...`
- Backend Gateway: `backend/orbit-platform/services/api-gateway/src/...`
- Cross-test: `tests/contract`, `tests/integration`, `tests/e2e`
- Feature docs/contracts: `specs/003-activation-uiux-overhaul/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: activation 구현의 계약/타입/계측 공통 기반 고정

- [X] T001 Finalize activation API contract in `specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml`
- [X] T002 Create activation feature types in `frontend/orbit-web/src/features/activation/types.ts`
- [X] T003 [P] Create activation API hook in `frontend/orbit-web/src/features/activation/hooks/useActivation.ts`
- [X] T004 [P] Create activation telemetry helper in `frontend/orbit-web/src/lib/telemetry/activationEvents.ts`
- [X] T005 [P] Create activation feature flag config in `frontend/orbit-web/src/lib/config/featureFlags.ts`
- [X] T006 Create activation contract test scaffold in `tests/contract/us3-activation-flow.contract.test.ts`
- [X] T007 [P] Create activation integration test scaffold in `tests/integration/us3-activation-foundation.test.ts`
- [X] T008 Document activation KPI collection assumptions in `specs/003-activation-uiux-overhaul/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리에서 공통으로 필요한 activation 상태/이벤트 백엔드 기반 선구축

**⚠️ CRITICAL**: 이 단계 완료 전 사용자 스토리 구현 시작 금지

- [X] T009 Create activation controller in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ActivationController.java`
- [X] T010 Create activation service in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ActivationService.java`
- [X] T011 [P] Create activation event sink port in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/port/out/ActivationEventSink.java`
- [X] T012 [P] Create in-memory activation event sink adapter in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/out/telemetry/InMemoryActivationEventSink.java`
- [X] T013 Create activation DTO records in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/dto/ActivationDtos.java`
- [X] T014 Wire activation service bean configuration in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/config/ActivationConfig.java`
- [X] T015 Create activation service unit tests in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/application/service/ActivationServiceTest.java`
- [X] T016 [P] Create activation controller web tests in `backend/orbit-platform/services/api-gateway/src/test/java/com/example/gateway/adapters/in/web/ActivationControllerTest.java`
- [X] T017 Create frontend activation store in `frontend/orbit-web/src/stores/activationStore.ts`
- [X] T018 Create guided empty-state registry in `frontend/orbit-web/src/features/activation/emptyStateRegistry.ts`

**Checkpoint**: activation state/event API와 프론트 공통 상태 저장소가 준비됨

---

## Phase 3: User Story 1 - First Session Activation (Priority: P1) 🎯 MVP

**Goal**: 신규 사용자가 첫 세션에서 혼란 없이 첫 작업을 만들도록 단일 행동 경로를 제공한다.

**Independent Test**: 새 계정 로그인 후 `/app` 진입 시 primary CTA로 첫 작업 생성까지 2분 내 완료 가능.

### Tests for User Story 1

- [X] T019 [P] [US1] Add first-session shell rendering test in `frontend/orbit-web/src/app/AppShell.test.tsx`
- [X] T020 [P] [US1] Add activation hero CTA-priority test in `frontend/orbit-web/src/pages/overview/OperationsHubPage.test.tsx`
- [X] T021 [P] [US1] Add first-session activation e2e scenario in `tests/e2e/us3-first-session-activation.spec.ts`

### Implementation for User Story 1

- [X] T022 [US1] Refactor activation-first hero and single primary CTA in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [X] T023 [US1] Create activation checklist component in `frontend/orbit-web/src/components/activation/ActivationChecklist.tsx`
- [X] T024 [US1] Integrate activation checklist into hub page in `frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
- [X] T025 [US1] Reduce competing top-level actions in shell header in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T026 [US1] Track first-task-created milestone from board create flow in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T027 [US1] Emit activation CTA/task events in `frontend/orbit-web/src/lib/telemetry/activationEvents.ts`
- [X] T028 [US1] Submit activation events via API hook in `frontend/orbit-web/src/features/activation/hooks/useActivation.ts`
- [X] T029 [US1] Update app bootstrap to load activation state in `frontend/orbit-web/src/app/router.tsx`
- [X] T030 [US1] Handle first-session stage transitions in backend service in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ActivationService.java`

**Checkpoint**: US1만으로도 신규 사용자는 첫 작업 생성을 독립적으로 완료 가능

---

## Phase 4: User Story 2 - Guided Core Workflow (Priority: P1)

**Goal**: Task → Board → Sprint → AI Insight 흐름을 empty-state와 context action으로 연결한다.

**Independent Test**: 빈 워크스페이스에서 안내만 따라 4단계 흐름을 완주 가능.

### Tests for User Story 2

- [X] T031 [P] [US2] Add guided empty-state component test in `frontend/orbit-web/src/components/common/EmptyStateCard.test.tsx`
- [X] T032 [P] [US2] Add guided flow integration test in `tests/integration/us3-guided-core-workflow.test.ts`
- [X] T033 [P] [US2] Add task-to-insight guided flow e2e test in `tests/e2e/us3-guided-core-workflow.spec.ts`

### Implementation for User Story 2

- [X] T034 [US2] Extend empty-state API (statusHint/learnMore/secondary actions) in `frontend/orbit-web/src/components/common/EmptyStateCard.tsx`
- [X] T035 [US2] Replace board empty-state with guided next-step actions in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T036 [US2] Replace sprint empty-state with recovery actions in `frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
- [X] T037 [US2] Replace insights empty-state with evaluation-start actions in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [X] T038 [US2] Add inbox guided empty-state and triage CTA in `frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- [X] T039 [US2] Add workspace-missing recovery action surface in `frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- [X] T040 [US2] Align nav deep-link continuity for guided flow in `frontend/orbit-web/src/app/navigationModel.ts`
- [X] T041 [US2] Emit empty-state action click telemetry in `frontend/orbit-web/src/lib/telemetry/activationEvents.ts`
- [X] T042 [US2] Persist EMPTY_STATE_ACTION_CLICKED events in backend in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ActivationService.java`

**Checkpoint**: US2 완료 시 빈 상태에서도 사용자 이탈 없이 다음 행동으로 복구 가능

---

## Phase 5: User Story 3 - Progressive Disclosure for Novice vs Advanced Use (Priority: P2)

**Goal**: 초심자 기본 화면은 단순화하고, 고급 기능은 명시적 확장에서만 노출한다.

**Independent Test**: first-session 사용자에게 Core 액션만 기본 노출되고, `More` 확장 시 고급 기능 접근 가능.

### Tests for User Story 3

- [X] T043 [P] [US3] Add navigation profile visibility tests in `frontend/orbit-web/src/app/navigationModel.test.ts`
- [X] T044 [P] [US3] Add progressive disclosure integration test in `tests/integration/us3-progressive-disclosure.test.ts`
- [X] T045 [P] [US3] Add advanced-controls expand e2e test in `tests/e2e/us3-progressive-disclosure.spec.ts`

### Implementation for User Story 3

- [X] T046 [US3] Introduce core/advanced nav grouping model in `frontend/orbit-web/src/app/navigationModel.ts`
- [X] T047 [US3] Implement `More` disclosure section in shell sidebar in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T048 [US3] Add novice-mode advanced filter collapse in `frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx`
- [X] T049 [US3] Collapse advanced task-create fields by default in `frontend/orbit-web/src/pages/projects/BoardPage.tsx`
- [X] T050 [US3] Persist disclosure mode in activation store in `frontend/orbit-web/src/stores/activationStore.ts`
- [X] T051 [US3] Expose navigation profile from activation endpoint in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ActivationController.java`
- [X] T052 [US3] Compute role/session-based navigation profile in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/application/service/ActivationService.java`

**Checkpoint**: US3 완료 시 novice/advanced 정보 밀도가 분리되어 인지부하가 감소

---

## Phase 6: User Story 4 - Explainable and Controllable AI Guidance (Priority: P2)

**Goal**: AI 결과를 state/confidence/reason/next-action 중심으로 표준화하고 제어 가능하게 만든다.

**Independent Test**: normal/fallback/no-data 상태에서 의미와 다음 행동을 사용자가 명확히 이해 가능.

### Tests for User Story 4

- [X] T053 [P] [US4] Add insights AI-state rendering tests in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.test.tsx`
- [X] T054 [P] [US4] Add fallback reason mapping integration test in `tests/integration/us3-ai-guidance-explainability.test.ts`
- [X] T055 [P] [US4] Add evaluated-vs-fallback e2e visibility test in `tests/e2e/us3-ai-guidance-states.spec.ts`

### Implementation for User Story 4

- [X] T056 [US4] Create normalized AI guidance status utility in `frontend/orbit-web/src/features/insights/aiGuidanceStatus.ts`
- [X] T057 [US4] Refactor insights page to use normalized guidance status in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [X] T058 [US4] Align shell rail coaching card with same status contract in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T059 [US4] Align floating agent messaging/state badges in `frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx`
- [X] T060 [US4] Remove hardcoded coaching/progress strings in shell rail in `frontend/orbit-web/src/app/AppShell.tsx`
- [X] T061 [US4] Extend evaluation response with explicit reason/state mapping in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [X] T062 [US4] Add deterministic fallback reason map for UI explainability in `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- [X] T063 [US4] Add explainability contract assertions in `tests/contract/us3-insights-explainability.contract.test.ts`

**Checkpoint**: US4 완료 시 AI 결과가 블랙박스가 아닌 설명 가능한 실행 가이드로 작동

---

## Phase 7: User Story 5 - Responsive and Accessible Task Flow (Priority: P3)

**Goal**: 모바일/키보드/줌 환경에서 핵심 작업 흐름이 깨지지 않도록 반응형·접근성 품질을 고정한다.

**Independent Test**: 390px 폭 + keyboard-only 조건에서 first-task 생성 및 insight 실행 가능.

### Tests for User Story 5

- [X] T064 [P] [US5] Add responsive overflow regression integration test in `tests/integration/us3-responsive-overflow.test.ts`
- [X] T065 [P] [US5] Add keyboard-only activation flow e2e test in `tests/e2e/us3-keyboard-activation-flow.spec.ts`
- [X] T066 [P] [US5] Add iPhone viewport first-task e2e test in `tests/e2e/us3-mobile-first-task.spec.ts`

### Implementation for User Story 5

- [X] T067 [US5] Remove double-wrapper layout rules for key pages in `frontend/orbit-web/src/design/layout.css`
- [X] T068 [US5] Simplify calendar page container hierarchy in `frontend/orbit-web/src/pages/projects/CalendarPage.tsx`
- [X] T069 [US5] Simplify table page container hierarchy in `frontend/orbit-web/src/pages/projects/TablePage.tsx`
- [X] T070 [US5] Simplify dashboard page container hierarchy in `frontend/orbit-web/src/pages/projects/DashboardPage.tsx`
- [X] T071 [US5] Simplify insights page container hierarchy in `frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
- [X] T072 [US5] Add explicit focus-visible styles for primary actions in `frontend/orbit-web/src/design/primitives.css`
- [X] T073 [US5] Harden <=390px shell header/menu wrapping behavior in `frontend/orbit-web/src/app/AppShell.tsx`

**Checkpoint**: US5 완료 시 모바일/접근성 결함으로 인한 핵심 플로우 중단이 제거됨

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리 통합 검증, KPI 계산 가능 상태, 릴리스 품질 마감

- [X] T074 [P] Add activation KPI query examples and formulas in `specs/003-activation-uiux-overhaul/quickstart.md`
- [X] T075 Add activation contract snapshot assertions in `tests/contract/us3-activation-flow.snapshot.test.ts`
- [X] T076 [P] Add activation event payload schema validation test in `tests/integration/us3-activation-events-schema.test.ts`
- [X] T077 Run and stabilize shell/core flow tests in `frontend/orbit-web/src/app/AppShell.test.tsx`
- [X] T078 Finalize feature release checklist for activation overhaul in `specs/003-activation-uiux-overhaul/checklists/release-readiness.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): 즉시 시작 가능
- Phase 2 (Foundational): Phase 1 완료 후 시작, 모든 스토리의 선행조건
- Phase 3~7 (User Stories): Phase 2 완료 후 착수
- Phase 8 (Polish): 모든 스토리 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: Foundational 완료 후 즉시 시작, MVP 핵심
- **US2 (P1)**: Foundational 완료 후 시작 가능, US1과 병렬 가능
- **US3 (P2)**: US1 기본 진입 UX가 안정된 후 권장
- **US4 (P2)**: US2(가이드 플로우)와 병행 가능하나 Insights 상태 표현은 US2 완료 후 검증 용이
- **US5 (P3)**: 모든 스토리와 병행 가능하나 최종 회귀는 마지막에 통합 검증

### Recommended Story Completion Order

1. US1 (Activation MVP)
2. US2 (Guided Core Flow)
3. US3 (Progressive Disclosure)
4. US4 (Explainable AI)
5. US5 (Responsive & Accessibility)

---

## Parallel Execution Examples

### Parallel Example: US1

```bash
T019 + T020 + T021 병렬 수행
T027 + T028 병렬 수행
```

### Parallel Example: US2

```bash
T031 + T032 + T033 병렬 수행
T041 + T042는 T034~T040 후 병렬 수행
```

### Parallel Example: US3

```bash
T043 + T044 + T045 병렬 수행
T051 + T052 병렬 수행
```

### Parallel Example: US4

```bash
T053 + T054 + T055 병렬 수행
T061 + T062 병렬 수행
```

### Parallel Example: US5

```bash
T064 + T065 + T066 병렬 수행
T068 + T069 + T070 + T071는 파일 분리 작업으로 병렬 수행
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 완료
2. Phase 2 완료
3. Phase 3(US1) 완료
4. SC-001/SC-002 지표 측정 가능 여부 확인 후 데모

### Incremental Delivery

1. US1 릴리스
2. US2 릴리스 (guided empty states)
3. US3 릴리스 (progressive disclosure)
4. US4 릴리스 (AI explainability)
5. US5 릴리스 (responsive/accessibility hardening)

### Team Parallel Strategy

- Engineer A: US1/US2 프론트 중심
- Engineer B: US3/US5 UX/레이아웃/접근성
- Engineer C: US4 + activation backend endpoint/contract
- QA: 스토리별 독립 E2E + 최종 통합 회귀

