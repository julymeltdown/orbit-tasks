# Quickstart: Activation-First UI/UX Overhaul

## 목적

이 문서는 `003-activation-uiux-overhaul` 설계 검증과 구현 착수를 위한 실행 가이드다.
목표는 “첫 세션 사용자가 2분 내 첫 작업 생성” 경로를 로컬에서 재현하고 계측 가능성을 확인하는 것이다.

## 사전 요구사항

1. Node.js 20+
2. Java 17
3. Docker (선택, 통합 의존성 구동 시)
4. Git, Bash

## 1) 브랜치 및 스펙 확인

```bash
cd /home/lhs/dev/tasks
git checkout 003-activation-uiux-overhaul
git status
ls -la /home/lhs/dev/tasks/specs/003-activation-uiux-overhaul
```

기대 결과:
- 현재 브랜치가 `003-activation-uiux-overhaul`
- `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` 존재

## 2) 프론트엔드 기본 검증

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npm install
npm run lint
npm test
npm run build
```

기대 결과:
- lint/test/build 모두 성공

## 3) API Gateway 기본 검증

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway
./gradlew test jacocoTestReport jacocoTestCoverageVerification
```

기대 결과:
- 테스트 통과
- JaCoCo coverage gate(line >= 70%, branch >= 55%) 통과

## 4) Activation 핵심 플로우 수동 스모크

### 시나리오 A: 첫 세션 가이드

1. 로그인 후 `/app` 진입
2. primary CTA가 1개만 강조되어 있는지 확인
3. primary CTA 클릭으로 `Create Task` 진입 확인

검증 포인트:
- competing primary 버튼이 다수 노출되지 않아야 함
- “다음에 무엇을 해야 하는지” 문구가 존재해야 함

### 시나리오 B: Empty State 복구 경로

1. Board가 비어있는 프로젝트 선택
2. empty-state에서 `Create Task` 또는 `Import` 액션 클릭
3. 실제 작업 생성 흐름으로 이동하는지 확인

검증 포인트:
- 안내 문구만 존재하고 액션이 없는 상태 금지

### 시나리오 C: Insights 설명성

1. `/app/insights` 진입
2. `Run Evaluation` 실행
3. 결과에서 state/confidence/reason/next actions 표시 확인
4. `simulate fallback` 실행 후 fallback 상태 표시 확인

## 5) Activation 이벤트 계약 스모크 (계약 기반)

### 5.1 Activation State 조회

```bash
curl -s "http://localhost:8080/api/v2/activation/state?workspaceId=<workspace-uuid>&projectId=<project-uuid>&userId=<user-id>" | jq
```

기대 결과:
- `activationStage`, `checklist[]` 필드 존재

### 5.2 Activation Event 전송

```bash
curl -s -X POST "http://localhost:8080/api/v2/activation/events" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId":"00000000-0000-0000-0000-000000000001",
    "projectId":"00000000-0000-0000-0000-000000000002",
    "userIdHash":"sha256:demo",
    "sessionId":"session-demo-001",
    "eventType":"ACTIVATION_PRIMARY_CTA_CLICKED",
    "route":"/app",
    "elapsedMs":4200,
    "metadata":{"cta":"create_first_task"}
  }' | jq
```

기대 결과:
- `status: accepted` 응답

## 6) 테스트 실행 매트릭스

### 프론트 단위/통합 테스트

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npx vitest run src/app/AppShell.test.tsx src/pages/projects/BoardPage.test.tsx src/pages/projects/CalendarPage.test.tsx
```

### 계약/통합 테스트

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npx vitest run ../../tests/contract ../../tests/integration
```

### E2E (핵심 시나리오)

```bash
cd /home/lhs/dev/tasks/tests/e2e
npm install
npx playwright install chromium
npx playwright test -c playwright.config.ts us1-navigation-scope-view.spec.ts us4-sprint-empty-state.spec.ts us8-mobile-menu-access.spec.ts --project=chromium
```

## 7) 수용 기준 체크 포인트

1. first session에서 첫 작업 생성까지 2분 내 완료 가능한가
2. Board/Sprint/Insights/Inbox empty-state에서 즉시 복구 CTA가 동작하는가
3. AI 결과가 not_run/evaluated/fallback을 일관되게 표현하는가
4. 모바일(390px)에서 수평 스크롤 없이 핵심 액션 접근이 가능한가
5. keyboard-only로 first-task 생성과 evaluation 실행이 가능한가

## 8) 참고 문서

- Spec: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/spec.md`
- Plan: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/plan.md`
- Research: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/research.md`
- Data model: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/data-model.md`
- Contract: `/home/lhs/dev/tasks/specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml`

## 9) Activation KPI 계산식

아래 집계는 `/api/v2/activation/events` 이벤트를 기준으로 계산한다.

1. **SC-001 (2분 내 첫 작업 생성률)**  
`count(FIRST_TASK_CREATED where elapsedMs <= 120000) / count(ACTIVATION_VIEW_LOADED)`

2. **SC-002 (첫 의미 행동까지 중앙값)**  
대상 이벤트: `FIRST_TASK_CREATED | BOARD_FIRST_INTERACTION | SPRINT_ENTERED | INSIGHT_EVALUATION_STARTED`  
측정값: `elapsedMs` 중앙값

3. **SC-003 (첫 작업 후 코어 스텝 진입률)**  
`count(session where FIRST_TASK_CREATED and any(core-step)) / count(session where FIRST_TASK_CREATED)`  
core-step: `BOARD_FIRST_INTERACTION | SPRINT_ENTERED | INSIGHT_EVALUATION_STARTED`

4. **SC-004 (empty-state bounce 감소율)**  
`1 - (count(view with no EMPTY_STATE_ACTION_CLICKED) / count(view with empty-state exposure))`

## 10) KPI 수집 가정

- `userId`는 클라이언트에서 해시(`userIdHash`)로 변환해 전송한다.
- `sessionId`는 브라우저 로컬 세션 기준으로 생성한다.
- 이벤트 실패는 UX를 블로킹하지 않고 best-effort로 전송한다.
