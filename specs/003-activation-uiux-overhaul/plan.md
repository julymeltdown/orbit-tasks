# Implementation Plan: Activation-First UI/UX Overhaul for Orbit Tasks

**Branch**: `003-activation-uiux-overhaul` | **Date**: 2026-03-05 | **Spec**: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/spec.md`  
**Input**: Feature specification from `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/spec.md` + codebase scan

## Summary

이번 기능의 목적은 “기능 추가”가 아니라 **초기 활성화(Activation) 실패를 구조적으로 제거**하는 것이다.
핵심 전략은 다음 4가지다.

1. 첫 진입 시점에 행동 우선 UX를 강제한다.
- 한 화면에서 `무엇을 해야 하는지`와 `어디로 가는지`를 명확히 제공
- 첫 세션 기준 1차 목표를 `첫 작업 생성`으로 고정

2. 빈 상태(Empty State)를 학습 상태로 전환한다.
- Board / Sprint / Insights / Inbox의 빈 상태를 각각 목적형 안내로 통일
- 액션 없는 안내 문구를 제거하고 즉시 실행 버튼을 제공

3. 고급 기능은 Progressive Disclosure로 지연 노출한다.
- 초심자 기본 화면은 코어 액션 중심으로 축소
- 고급 필드/고급 내비/고급 AI 컨트롤은 명시적 확장 경로에서만 노출

4. AI를 설명 가능한 보조 계층으로 고정한다.
- 상태(`not_run`, `evaluated`, `fallback`) + confidence + reason을 항상 노출
- 추천은 항상 사용자 제어 하에서만 적용

## Codebase Scan Baseline (2026-03-05)

### Frontend (현재 상태 확인 파일)

- 앱 프레임/내비
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/app/AppShell.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/app/router.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/app/navigationModel.ts`
- 홈/워크스페이스 진입
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/overview/OperationsHubPage.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx`
- 핵심 실행 화면
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/projects/BoardPage.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/pages/inbox/InboxPage.tsx`
- 공통 컴포넌트
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/components/common/EmptyStateCard.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/components/agile/DSUSuggestionReviewPanel.tsx`
- 상태/훅
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/features/agile/hooks/useDsuReminder.ts`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/features/agile/hooks/useDsuSuggestions.ts`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/features/agile/hooks/useSprintPlanning.ts`
  - `/home/lhs/dev/tasks/frontend/orbit-web/src/stores/projectViewStore.ts`

### Backend/API (연계 상태 확인 파일)

- Sprint/DSU/Reminder 엔드포인트
  - `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java`
- Insights 평가 엔드포인트
  - `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java`
- Work-item/Dependency/API v2
  - `/home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`

### 현재 구현 관찰 요약

1. Activation 경로 분산
- `/app` 진입 후 여러 모듈 카드가 동시에 보여 우선 행동이 분산됨
- `한 번에 한 행동` 원칙이 적용되지 않음

2. Empty State 설계 불균질
- 일부 페이지는 CTA가 있고, 일부는 정보 문구 위주
- `무엇을 먼저 해야 하는지`가 페이지마다 다르게 표현됨

3. 초심자/고급 사용자 경로가 혼합
- Board/Sprint/Insights에서 고급 제어가 초기 화면부터 노출
- 학습 순서가 아닌 기능 나열 순서로 인지됨

4. AI 신뢰 신호는 부분 구현
- Fallback/Reason/Confidence 표시는 있으나 페이지 간 표현/문구 일관성이 약함
- 비평가(why/how) 문구와 다음 행동 버튼의 결합이 부족함

5. 계측(Activation KPI) 계약 부재
- 요청 단위 텔레메트리는 있으나(`CorrelationIdFilter`, `TelemetryService`)
- “first task in 2 min” 같은 제품 KPI 측정을 위한 명시적 이벤트 계약이 없음

## Technical Context

**Language/Version**: Java 17, TypeScript 5.9, React 18, Spring Boot 4.0.1  
**Primary Dependencies**: React Router 6.30, Zustand 4.5, dnd-kit 6.3, FullCalendar 6.1, Vitest 2.1, Playwright, Spring Security 7, Spring gRPC 1.0.2  
**Storage**: Gateway 기준 in-memory 도메인 상태 + 일부 서비스 RDB(PostgreSQL/H2) 병행  
**Testing**: Vitest, Playwright, JUnit5, ArchUnit, JaCoCo, contract/integration suites under `/home/lhs/dev/tasks/tests`  
**Target Platform**: Responsive web (Desktop + iPhone class mobile browsers) on K3s deployment  
**Project Type**: Frontend SPA + API Gateway + microservices  
**Performance Goals**:
- SC-001 달성을 위한 first-task completion median < 120s
- first-login → first meaningful action median < 180s
- activation critical path 렌더 체감 지연 최소화(불필요 DOM depth 및 중복 wrapper 제거)
**Constraints**:
- 첫 화면 primary CTA 1개 원칙
- 고급 기능은 기본 collapse
- AI recommendation은 사용자 제어 상태 유지
- 가로 오버플로우 없는 모바일 레이아웃
- hardcoded AI 수치 노출 금지(실시간 신호 기반)
**Scale/Scope**:
- 적용 범위: `/app`, `/app/workspace/select`, `/app/projects/*`, `/app/sprint`, `/app/insights`, `/app/inbox`
- 대상 사용자: 첫 세션 신규 사용자 + 반복 사용자 중 low-confidence cohort

## Constitution Check (Pre-Design Gate)

기준 문서: `/home/lhs/dev/tasks/backend/orbit-platform/.specify/memory/constitution.md`

| Gate | Constitution Rule | Status | Plan 대응 |
|---|---|---|---|
| G1 | Service Autonomy & Independent Lifecycle | PASS | 신규 구현은 서비스 독립 실행 구조를 깨지 않으며, 프론트 중심 개선 + 기존 API 계약 명시화로 진행 |
| G2 | Official Documentation First (Spring Security 7 / Spring gRPC) | PASS | 인증/권한/통신 프레임 변경 없음. 관련 영역 확장 시 공식 문서 기준 유지 |
| G3 | Contracted Interfaces & Versioning | PASS | 본 계획에서 activation 관련 API 계약을 `/specs/003-activation-uiux-overhaul/contracts/`에 명시 |
| G4 | Hexagonal Architecture Enforcement | PASS (No new violation) | 신규 API 제안 시 controller in-memory 추가 금지, application port 경유 원칙 명시 |

## Project Structure

### Documentation (this feature)

```text
/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── activation-flow.openapi.yaml
└── tasks.md (phase 2 output, not created in this command)
```

### Source Code (repository root)

```text
/home/lhs/dev/tasks/
├── frontend/orbit-web/
│   ├── src/app/
│   ├── src/pages/
│   ├── src/components/
│   ├── src/features/
│   └── src/design/
├── backend/orbit-platform/services/
│   ├── api-gateway/
│   ├── agile-ops-service/
│   ├── collaboration-service/
│   └── schedule-intelligence-service/
└── tests/
    ├── contract/
    ├── integration/
    └── e2e/
```

**Structure Decision**: 기존 Web application + microservice 구조를 유지한다. 이번 스펙은 프론트 UX/flow 재구성과 activation 계측 계약 정밀화에 집중하며, backend는 필요한 최소 계약 보강만 계획한다.

## Phase 0: Research Plan (Unknown Resolution + Best Practice Decisions)

본 기능의 핵심 불확실성은 기술 자체가 아니라 **행동 유도 방식**과 **계측 방식**이다. 아래 질문을 research 단계에서 결정한다.

### RQ-01 Activation 기준 정의
- 질문: “활성화 완료”를 정확히 어떤 사건 조합으로 정의할 것인가?
- 후보:
  - A: first task created only
  - B: first task + board revisit
  - C: first task + one more core step
- 산출: ActivationState의 `completed` 계산 규칙

### RQ-02 Empty State 공통 계약
- 질문: 페이지별 문구 자유도를 유지할지, 공통 스키마로 통일할지
- 후보:
  - A: 페이지별 자유 텍스트
  - B: 공통 구조(`title`, `description`, `primaryAction`, `secondaryActions[]`, `learnMore`) 강제
- 산출: GuidedEmptyState 스키마

### RQ-03 Progressive Disclosure 범위
- 질문: 숨길 항목을 UI 레벨(접기)로만 처리할지, 역할/세션 상태와 결합할지
- 후보:
  - A: 항상 동일 UI + 단순 collapse
  - B: first-session + role 기반 disclosure 정책
- 산출: NavigationProfile 및 UI 노출 규칙

### RQ-04 AI Explainability 최소 조건
- 질문: “AI를 신뢰 가능한 보조로 보이게 하는 최소 UI 요소”는 무엇인가
- 후보:
  - A: confidence만
  - B: confidence + reason
  - C: confidence + reason + next action + fallback badge
- 산출: AIGuidanceStatus 렌더링 규칙

### RQ-05 Activation 계측 수집 경로
- 질문: 제품 KPI 이벤트를 어떤 계약으로 남길지
- 후보:
  - A: 프론트 로그만
  - B: 서버 텔레메트리 summary 활용
  - C: activation 전용 이벤트 API 신설 + 기존 telemetry 병행
- 산출: `/api/v2/activation/events` 계약 여부 결정

## Phase 1: Design & Contracts

### 1) UX Information Architecture Design

#### 1.1 Entry Priority Rule
- `/app` 최초 진입 시 “first meaningful action” 중심 레이아웃
- primary CTA 1개, secondary CTA 최대 2개
- CTA 우선순위: `Create first task` > `Import tasks` > `Invite teammate`

#### 1.2 Core vs Advanced Surface 분리
- Core nav: Dashboard, Board, Sprint, Inbox, Insights
- Advanced nav: Table, Timeline, Calendar, Integrations, Admin
- 노출 방식: 기본 Core + `More` 확장

#### 1.3 Empty State 표준화
- 공통 컴포넌트 책임 분리:
  - 설명 텍스트
  - 현재 상태 표시
  - 즉시 실행 액션
  - 보조 학습 링크
- 적용 페이지:
  - Board: 작업 생성 유도
  - Sprint: 스프린트 생성/선택 유도
  - Insights: 평가 실행 유도
  - Inbox: triage 시작 유도

### 2) Data Design

- ActivationState
- GuidedEmptyState
- NavigationProfile
- InsightInputSignals
- AIGuidanceStatus
- ActivationEvent

상세 필드/관계/검증 규칙은 `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/data-model.md`에 정의한다.

### 3) API Contract Design

- 신규/확장 계약을 `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml`에 정의
- 핵심 계약 범위
  - Activation state 조회
  - Activation event 수집
  - 첫 작업 생성
  - DSU reminder 상태
  - AI evaluation/latest

### 4) Instrumentation Design

#### 필수 이벤트
- `activation_view_loaded`
- `activation_primary_cta_clicked`
- `first_task_created`
- `board_first_interaction`
- `insight_evaluation_started`
- `insight_evaluation_completed`
- `sprint_started`

#### 필수 차원
- workspaceId, projectId, userId(hashed), role, sourceRoute, elapsedMs

#### KPI 연결
- SC-001, SC-002, SC-003, SC-004 직접 계산 가능해야 함

### 5) Accessibility & Responsive Design Gates

- Keyboard focus visible (모든 주요 액션 버튼)
- 모바일 390px 폭 기준 수평 스크롤 금지
- 텍스트/배지/상태 색상은 비색상 신호와 동시 제공
- overlay/drawer에서 focus trap 및 restore 보장

## Phase 2: Implementation Planning (Task-ready Decomposition)

### Workstream A: Activation Landing Refactor
- 대상: `OperationsHubPage`, `AppShell`, `WorkspaceEntryPage`
- 목표:
  - 첫 세션 가이드 카드 도입
  - 우선순위 CTA 정리
  - 중복 액션 제거
- 완료 기준:
  - first session에서 사용자가 1번 클릭으로 task 생성 진입 가능

### Workstream B: Empty State Normalization
- 대상: `EmptyStateCard` + Board/Sprint/Insights/Inbox page
- 목표:
  - 페이지별 제각각 안내를 공통 계약으로 통일
- 완료 기준:
  - 모든 빈 상태가 최소 1개의 즉시 액션 제공

### Workstream C: Progressive Disclosure
- 대상: `navigationModel`, `ProjectFilterBar`, create panels
- 목표:
  - advanced controls 기본 숨김
  - 확장 시 일관 레이블
- 완료 기준:
  - novice 기본 화면에서 고급 제어가 시각 우선순위를 침범하지 않음

### Workstream D: AI Explainability Consistency
- 대상: `ScheduleInsightsPage`, `FloatingAgentWidget`, `AppShell` rail
- 목표:
  - reason/confidence/fallback/next action 표준화
- 완료 기준:
  - `not_run`/`evaluated`/`fallback` 상태가 동일 패턴으로 표현됨

### Workstream E: Activation Event Instrumentation
- 대상: frontend event dispatch + gateway endpoint contract
- 목표:
  - KPI 수집 가능 이벤트 집계 경로 확보
- 완료 기준:
  - SC-001~SC-004 계산에 필요한 event schema 고정

### Workstream F: QA Gate
- 단위 테스트: 컴포넌트 별 가시성/상태/CTA 우선순위
- 통합 테스트: first session core flow
- E2E 테스트: mobile/keyboard/empty state 행동

## Test Strategy

### Unit (Frontend)

- `EmptyStateCard`: actions 렌더/순서/variant
- `AppShell`: role-based nav + first-session CTA 우선순위
- `ScheduleInsightsPage`: AI 상태 레이블 매핑(`not_run`, `fallback`, `evaluated`)
- `DSUComposerPanel`: 최소 입력 검증 + submit payload 구성

### Integration

- first-task 생성 후 board 진입 시 empty-state가 task-state로 전환되는지
- active sprint 없음 상태에서 sprint CTA 경로 정상 동작
- insights no-data 상태에서 run-evaluation 동작
- activation events payload 스키마 검증

### E2E

- 신규 사용자 first session: login → `/app` → first task create → board 확인
- mobile(390px): 수평 오버플로우 없이 core CTA 접근 가능
- keyboard only: primary CTA 및 핵심 네비게이션 완료 가능

### Contract

- activation-flow.openapi.yaml request/response schema snapshot
- 기존 v2 엔드포인트와 activation 계약 간 경로 충돌 없음 검증

## Rollout, Metrics, and Risk Control

### Rollout

1. feature flag: `activation_ui_v1`
2. internal workspace canary 적용
3. KPI 확인 후 전체 롤아웃

### Metrics

- Activation rate (SC-001)
- Time-to-first-task (SC-002)
- First-session core-step continuation rate (SC-003)
- Empty-state bounce reduction (SC-004)

### Risks

1. 기존 파워유저가 “기능 숨김”으로 인지할 위험
- 대응: `More`와 단축키 노출 유지

2. 이벤트 과수집/중복 이벤트 위험
- 대응: event idempotency key + session sequence 도입

3. AI 출력 불일치로 신뢰도 저하
- 대응: 상태 배지/근거/fallback reason 항상 표시

## Post-Design Constitution Check

| Gate | Status | Re-check Result |
|---|---|---|
| G1 Service autonomy | PASS | 프론트 중심 개편이며 서비스 독립 실행성 저해 요소 없음 |
| G2 Official docs | PASS | Spring Security/gRPC 변경 없음 |
| G3 Contract versioning | PASS | activation-flow.openapi.yaml 명시로 인터페이스 문서화 완료 |
| G4 Hexagonal enforcement | PASS | 신규 API 제안 시 controller 상태 보유 금지 원칙 유지 |

## Complexity Tracking

위반 사항 없음. 본 계획은 기존 아키텍처를 유지하면서 UI/UX activation 품질을 높이는 범위로 제한된다.
