# Research: Activation-First UI/UX Overhaul

## Scope

본 리서치는 `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/spec.md` 구현을 위한 설계 의사결정을 정리한다.
중점은 다음 3가지다.

1. 신규 사용자 첫 세션에서의 Activation 성공률 개선
2. 고급 기능 과노출로 인한 인지부하 완화
3. AI/DSU/Insights의 설명성·신뢰성 일관화

## Codebase Facts Used

1. `/app` 진입 이후 OperationsHub에 여러 모듈 CTA가 병렬 배치되어 우선행동이 분산됨.
2. EmptyState UX가 페이지마다 불균질하며, CTA 없는 텍스트 상태가 존재함.
3. Insights 페이지는 reason/confidence/fallback 표시 로직이 있으나 shell rail/다른 AI surface와 표현이 다름.
4. DSU reminder API(`/api/v2/dsu/reminders`)와 DSU suggest/apply 흐름은 구현되어 있음.
5. Activation KPI(예: first-task ≤ 2분) 계산용 명시적 이벤트 계약은 없음.

## Decisions

### Decision 1: Activation 완료 기준을 2단계로 정의

**Decision**:
- 1차 Activation: `first_task_created`
- 2차 Activation: `first_task_created` 이후 동일 세션 내 `board_interaction | sprint_entry | insight_evaluation_started` 중 1개 이상

**Rationale**:
- 사용자가 단순 생성만 하고 이탈하는 케이스와 실제 워크플로 진입을 구분할 수 있다.
- SC-001과 SC-003을 분리 측정할 수 있어 개선 포인트가 명확해진다.

**Alternatives considered**:
- first-task 하나만으로 Activation 완료 처리
- Sprint 시작까지를 Activation 완료로 강제

### Decision 2: First Session에서 primary CTA를 단일화

**Decision**:
- first session landing에서 primary CTA는 `Create your first task` 1개만 노출
- secondary CTA는 최대 2개(`Import`, `Invite`)만 노출

**Rationale**:
- 선택지 과다로 인한 첫 행동 지연을 줄인다.
- 목표 행동(작업 생성)으로 유입을 집중시킨다.

**Alternatives considered**:
- 모듈 카드 전부 동일 비중 유지
- role별로 primary CTA를 매번 다르게 제공

### Decision 3: Empty State를 공통 계약으로 통일

**Decision**:
- `GuidedEmptyState` 계약을 공통 컴포넌트로 강제
- 필수 필드: `title`, `description`, `primaryAction`
- 선택 필드: `secondaryActions[]`, `learnMoreLink`, `statusHint`

**Rationale**:
- 페이지별 안내 품질 편차를 제거하고, 새 화면 추가 시에도 동일한 UX 품질을 유지할 수 있다.

**Alternatives considered**:
- 화면별 자유형 문구 유지
- 페이지별 별도 컴포넌트 유지

### Decision 4: Progressive Disclosure를 세션 상태와 결합

**Decision**:
- disclosure 정책을 `isFirstSession` + `role` + `routeContext`로 계산
- first session에서는 고급 제어를 기본 접힘 상태로 유지

**Rationale**:
- 단순 collapse만으로는 초심자 과부하를 충분히 줄이기 어렵다.
- 사용자 상태 기반으로 노출 강도를 조절해야 체감 개선이 크다.

**Alternatives considered**:
- 모든 사용자에게 동일한 collapse 규칙 적용
- 고급 기능 완전 숨김

### Decision 5: AI Explainability 최소 계약 4요소 고정

**Decision**:
- AI surface는 항상 아래 4요소를 표시
  - `state`: not_run/evaluated/fallback
  - `confidence`
  - `reason`
  - `nextAction[]`

**Rationale**:
- “왜 이 결과가 나왔는지”와 “이제 무엇을 해야 하는지”를 동시에 제공해야 신뢰와 행동 전환이 발생한다.

**Alternatives considered**:
- confidence만 노출
- reason 텍스트만 노출

### Decision 6: Hardcoded productivity numbers 제거

**Decision**:
- Insights/Shell rail의 수치형 지표는 `deriveInsightSignals(items, sprintCapacity)` 혹은 평가 결과 기반으로만 렌더
- 정적 샘플 텍스트는 fallback placeholder로 제한

**Rationale**:
- 사용자가 수치 의미를 이해하지 못하는 문제의 핵심은 “맥락 없는 숫자”와 “실데이터와 불일치”다.

**Alternatives considered**:
- 기본 템플릿 수치(예: 68%, 21/18) 유지
- 데이터가 없을 때도 임의 수치 노출

### Decision 7: Activation 이벤트 전용 계약 추가

**Decision**:
- `/api/v2/activation/events`와 `/api/v2/activation/state` 계약을 추가
- request-level telemetry와 별도로 제품 KPI 이벤트를 수집

**Rationale**:
- 요청 텔레메트리만으로는 UX 개선 성공 여부(Activation KPI)를 계산하기 어렵다.

**Alternatives considered**:
- 프론트 로컬 로그만으로 측정
- 기존 admin telemetry summary 재사용

### Decision 8: Empty 상태에서도 복구 경로를 항상 제공

**Decision**:
- `no workspace`, `no active sprint`, `no evaluation`, `empty board` 상태 각각에 복구 CTA를 필수 제공

**Rationale**:
- 에러/빈 상태에서 사용자가 막히는 순간 이탈이 크게 증가한다.

**Alternatives considered**:
- 안내 문구만 제공
- 도움말 링크만 제공

### Decision 9: Navigation Profile 엔티티 도입

**Decision**:
- Core/Advanced 메뉴 노출 상태를 profile로 저장
- 사용자 세션/역할에 따라 기본값을 계산하되 사용자가 override 가능

**Rationale**:
- 일회성 guided tour보다 지속 가능한 정보 밀도 제어가 필요하다.

**Alternatives considered**:
- 고정 네비게이션 유지
- 완전 role 기반만 적용

### Decision 10: 모바일 레이아웃 규칙을 컴포넌트 수준으로 강제

**Decision**:
- 폭 고정 카드/중첩 패딩 패턴 금지
- 주요 카드 컨테이너는 단일 wrapper 원칙 적용
- 390px 기준 수평 스크롤 0 목표

**Rationale**:
- 현재 UX 불만의 핵심 중 하나가 “콘텐츠가 박스 안 박스로 좁아짐”이므로 구조 차원에서 방지해야 한다.

**Alternatives considered**:
- 화면별 CSS 핫픽스 누적
- 반응형 버그 발생 시 개별 보수

### Decision 11: AI fallback을 실패가 아닌 상태로 표현

**Decision**:
- fallback을 오류로 숨기지 않고 명시 상태로 표현
- fallback reason + deterministic action을 동일 카드에 제공

**Rationale**:
- AI 실패를 숨기면 신뢰가 더 낮아진다. 사용자에게는 “현재 가능한 최선의 결과”가 무엇인지가 중요하다.

**Alternatives considered**:
- fallback 시 generic error만 노출
- fallback 결과를 primary 결과와 구분하지 않음

### Decision 12: 테스트 게이트를 Activation KPI 중심으로 재배치

**Decision**:
- 테스트 카테고리를 UI correctness 중심에서 행동 결과 중심으로 보강
- 필수 시나리오:
  - first task 2분 이내 완료
  - empty-state CTA로 복구 성공
  - keyboard-only 주요 흐름 성공

**Rationale**:
- 이번 개편은 기능 존재 여부보다 “처음 써도 바로 된다”가 목적이다.

**Alternatives considered**:
- 기존 렌더/스냅샷 위주 테스트 유지
- KPI 측정을 운영 대시보드에서만 확인

## Resolved Clarifications

- “Activation”의 최소·확장 정의를 확정했다.
- “too many elements” 해결 방식은 disclosure + CTA 우선순위로 확정했다.
- “AI 숫자 의미 불명” 문제는 설명 계약(상태/근거/행동)과 하드코딩 제거로 확정했다.
- “측정 불가능” 문제는 activation event 계약 추가로 해소했다.

## Implementation Consequences

### Positive

1. 신규 사용자 기준 first action까지의 경로 길이가 짧아진다.
2. empty 상태에서 이탈률을 직접적으로 낮출 수 있다.
3. AI surface의 신뢰/예측 가능성이 높아진다.
4. SC-001~SC-004 측정 기반의 반복개선이 가능해진다.

### Trade-offs

1. 초기에는 일부 파워유저가 화면 단순화에 위화감을 느낄 수 있다.
2. activation event 수집 설계/검증 비용이 추가된다.
3. 기존 페이지별 custom copy가 공통 계약으로 묶이면서 자유도가 줄어든다.
