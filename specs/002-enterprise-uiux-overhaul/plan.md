# Implementation Plan: Orbit Tasks UI/UX + 기능 + API/아키텍처 동시 개편

**Branch**: `002-enterprise-uiux-overhaul` | **Date**: 2026-03-04 | **Spec**: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/spec.md`  
**Input**: 최신 확정 스펙(2026-03-04) + 코드베이스 정밀 스캔 결과

## Summary

이번 개편의 목표는 다음 3가지를 동시에 달성하는 것이다.

1. **핵심 실행 루프 완성(P0)**  
   Sprint 생성 → Backlog 편입 → AI Day Plan Draft 생성 → 사용자 편집/Freeze → 실행(Board/Calendar/Timeline) → DSU 제출 → AI 변경 제안 → 사용자 승인 반영 → 헬스 코칭
2. **API Gateway 인메모리 상태 제거**  
   Gateway는 인증/권한/오케스트레이션만 담당하고, 상태/도메인 로직은 각 서비스로 위임
3. **LLM 안전 정책 고정**  
   `gpt-5.2-pro` + Responses API + strict JSON schema + `store:false` 기본 + 항상 Draft/Confirm/Apply

브레이킹 변경을 허용하며(프론트/백엔드 동시 배포 전제), `/api/v2/*`를 기준으로 인터페이스를 재정의한다.

## Confirmed Decisions

1. 구현 범위는 **프론트 + API + 백엔드 아키텍처(+필요 시 스키마)**.
2. LLM 반영 정책은 **항상 사용자 컨펌 후 적용**.
3. Phase 1 우선순위는 **Sprint-DSU 루프 완성**.
4. 채팅 전략은 외부 SaaS 우선이 아니라 **내장 GPT 호출형 코치**.
5. API 호환성은 **브레이킹 변경 허용**.

## Codebase Scan Baseline (2026-03-04)

### Frontend 핵심 파일 (실측)

- 진입/내비: `frontend/orbit-web/src/app/AppShell.tsx`, `router.tsx`, `navigationModel.ts`
- 프로젝트 뷰: `BoardPage.tsx`, `TablePage.tsx`, `TimelinePage.tsx`, `CalendarPage.tsx`, `DashboardPage.tsx`
- 스프린트/DSU: `SprintWorkspacePage.tsx`, `DSUComposerPanel.tsx`
- 협업: `InboxPage.tsx`, `ThreadPanel.tsx`
- AI: `ScheduleInsightsPage.tsx`, `FloatingAgentWidget.tsx`

### Backend 핵심 파일 (실측)

- Gateway 인메모리 상태 포함 컨트롤러:
  - `backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java`
  - `.../SprintController.java`
  - `.../ScheduleEvaluationController.java`
  - `.../ThreadController.java`
  - `.../PortfolioController.java`
  - `.../TeamController.java`
  - `.../ProjectViewController.java`
- LLM 클라이언트:
  - `backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/adapters/out/llm/OpenAiEvaluationClient.java`

### 주요 관찰

1. 프론트는 멀티뷰 구조가 있으나, Sprint Wizard/Day Plan Freeze/DSU Suggest-Apply 루프가 단절되어 있다.
2. Gateway가 여러 도메인의 상태를 직접 보유하여 서비스 경계가 약하다.
3. OpenAPI 계약(`contracts/gateway-uiux.openapi.yaml`)과 실제 엔드포인트가 불일치한다.
4. LLM 호출은 현재 strict schema 기반이 아닌 텍스트 JSON 파싱 의존이 있어 강건성이 낮다.
5. UUID/내부 식별자 노출, 인박스/협업 triage UX, 모바일 밀도 문제 등 UI 잔여 결함이 있다.

## Technical Context

**Language/Version**: Java 17, TypeScript 5.9, React 18  
**Primary Dependencies**: Spring Boot 4.0.1, Spring Security 7, Spring gRPC 1.0.2, Zustand, dnd-kit, FullCalendar, Vitest, Playwright  
**Storage**: PostgreSQL, Redis (서비스별), 계약 파일(YAML/OpenAPI)  
**Testing**: JUnit5 + ArchUnit + JaCoCo, Vitest, Playwright, contract/integration suites  
**Target Platform**: Responsive Web (Desktop + Mobile Safari/Chrome), K3s  
**Project Type**: Frontend + API Gateway + Backend microservices  
**Performance Goals**:
- Board 상태 전환 UI 반응 p95 < 150ms
- Gateway API p95 < 500ms
- 5k work-items 조회/렌더 시 실사용 가능한 스크롤 및 필터 반응성 확보
**Constraints**:
- Draft/Confirm/Apply 불변 원칙
- Gateway 무상태화(도메인 상태 미보유)
- 브레이킹 API를 `/api/v2`로 일괄 승격
- 모바일(iPhone 12 mini / 15 Pro) 오버플로우/가림 결함 0 목표

## Target Architecture

### Responsibility Split

- **API Gateway**: 인증/권한/입력검증/오케스트레이션/에러 매핑/응답 표준화
- **Workgraph Service**: WorkItem/Dependency/Activity
- **Agile Ops Service**: Sprint/Backlog/DayPlan/DSU normalization
- **Collaboration Service**: Thread/Message/Mention/Inbox
- **Schedule Intelligence Service**: Evaluation/LLM orchestration/fallback
- **Team Service**: Team/Invite/Role

### Error Code Standard

공통 에러코드를 `code` 필드로 통일한다.

- `DEPENDENCY_CYCLE`
- `LOW_CONFIDENCE`
- `CONFIRMATION_REQUIRED`
- `INVALID_SCOPE`
- `NO_ACTIVE_SPRINT`

## Public API Plan (Breaking, /api/v2)

다음 REST 계약을 canonical source로 사용한다.

| Method | Path | 설명 |
|---|---|---|
| POST | /api/v2/work-items | 카드 생성 |
| PATCH | /api/v2/work-items/{id} | 제목/담당/우선순위/기한/추정/본문 수정 |
| PATCH | /api/v2/work-items/{id}/status | 상태 전환 |
| POST | /api/v2/work-items/{id}/dependencies | 의존성 추가 |
| DELETE | /api/v2/dependencies/{id} | 의존성 제거 |
| GET | /api/v2/work-items | 필터/검색/뷰용 조회 |
| GET | /api/v2/work-items/{id}/activity | 활동 로그 조회 |
| POST | /api/v2/sprints | 스프린트 생성 |
| POST | /api/v2/sprints/{id}/backlog-items | 스프린트 백로그 편입 |
| POST | /api/v2/sprints/{id}/day-plan:generate | AI 데일리 플랜 Draft 생성 |
| PATCH | /api/v2/day-plans/{id} | 일일 계획 편집 |
| POST | /api/v2/sprints/{id}:freeze | 플랜 동결 |
| POST | /api/v2/dsu | DSU 원문 저장 |
| POST | /api/v2/dsu/{id}:suggest | DSU 기반 변경 제안 생성 |
| POST | /api/v2/dsu/{id}:apply | 승인된 제안만 반영 |
| POST | /api/v2/insights/evaluations | 일정 헬스 평가 |
| POST | /api/v2/insights/evaluations/{id}/actions | 권고 수락/편집/무시 |
| POST | /api/v2/threads | 스레드 생성 |
| POST | /api/v2/threads/{id}/messages | 메시지 전송 |
| GET | /api/v2/inbox | 인박스 조회 |
| PATCH | /api/v2/inbox/{id} | read/resolve 상태 변경 |
| POST | /api/v2/teams | 팀 생성 |
| POST | /api/v2/teams/{id}/invites | 멤버 초대 |
| PATCH | /api/v2/teams/{id}/members/{userId} | 역할 수정 |

## Frontend Model Changes

1. `WorkItem` 확장: `estimateMinutes`, `actualMinutes`, `blockedReason`, `markdownBody`, `activityCount`
2. `Sprint` 확장: `freezeState`, `dailyCapacityMinutes`
3. `DSUSuggestion` 신설:
   - `suggestionId`, `targetType`, `targetId`, `proposedChange`, `confidence`, `reason`, `approved`
4. `Evaluation` 신설:
   - `health`, `risks`, `questions`, `actions`, `fallback`, `confidence`

## Data Model / Migration Plan (서비스별 분리)

- Agile Ops:
  - `day_plan`, `day_plan_item`
  - `dsu_entry`, `dsu_suggestion`, `dsu_apply_log`
- Workgraph:
  - `work_item_activity`
- Collaboration:
  - `inbox_item` 확장 (`source_type`, `source_id`, `status`, `resolved_at`)
- Schedule Intelligence:
  - `schedule_evaluation` 확장 (`fallback`, `confidence`, `reason`, `context_hash`)

## LLM Pipeline Plan (Draft/Confirm/Apply)

### Model + API

- Model: `gpt-5.2-pro`
- API: Responses API
- Output: strict JSON schema
- Default storage: `store:false`
- 민감정보 정책: 마스킹 후 전달

### Flow

1. Draft 생성 API 호출
2. UI에서 제안 목록 렌더
3. 사용자 승인 목록 선택
4. Apply API 호출(원자 트랜잭션)
5. 실패/저신뢰 시 fallback + 질문형 응답

### Fallback

- 429/timeout/schema mismatch 시 deterministic 제안 반환
- confidence 임계치 미만 시 `LOW_CONFIDENCE` + apply 차단

## Constitution Check

기준 문서: `/home/lhs/dev/tasks/backend/orbit-platform/.specify/memory/constitution.md`

| Gate | Rule | Status | Findings | Action |
|---|---|---|---|---|
| G1 | 서비스 독립 실행 | PASS | 모든 서비스에 `gradlew` 존재 확인 | 유지 |
| G2 | 공식 문서 기반 보안/통신 | PASS | Spring Security/Spring gRPC 라인 유지 | 구현 시 문서 기반 검증 |
| G3 | 계약 우선(버전드) | FAIL | 현재 `/api` 혼재 + 계약/구현 불일치 | `/api/v2` 계약 선반영 후 코드 정렬 |
| G4 | 헥사고날 경계 | FAIL | Gateway에 도메인 상태/로직 잔존 | Port/Adapter 위임 구조로 전환 |

## Quality Gates (Hexagonal + Coverage)

1. **Gateway 무상태 게이트**: `WorkItemController`, `SprintController`, `ThreadController`, `ScheduleEvaluationController`, `PortfolioController`, `TeamController`, `ProjectViewController`에서 인메모리 컬렉션 필드 제거.
2. **헥사고날 게이트**: 변경 서비스(api-gateway, workgraph, agile-ops, collaboration, schedule-intelligence, team) 각각에 ArchUnit 경계 테스트 1개 이상 유지.
3. **Coverage 게이트**:
   - Backend touched service: line >= 70%, branch >= 55%
   - Frontend touched package: statements >= 65%
4. **계약 동기화 게이트**: `/api/v2` OpenAPI와 gateway route-contract이 경로/메서드 기준 1:1 매핑.
5. **LLM 안전 게이트**: `store:false` 기본, strict schema 불일치 시 fallback 필수, `LOW_CONFIDENCE`에서 apply 차단.

## Implementation Phases

### Phase 0 - Contract & Type Freeze

Deliverables:
- `/specs/002-enterprise-uiux-overhaul/contracts/gateway-uiux.openapi.yaml` v2
- 프론트 타입 초안(`WorkItem/Sprint/DSUSuggestion/Evaluation`)
- 공통 에러 코드 표준 문서

### Phase 1 - P0 Sprint-DSU Loop

Deliverables:
- Sprint Wizard 3-Step UI
- Day Plan Draft 생성/편집/Freeze
- DSU Submit/Suggest/Apply(컨펌 필수)
- Board/Calendar/Timeline 실행 루프 연결

### Phase 2 - Gateway Delegation Refactor

Deliverables:
- Gateway 인메모리 제거
- v2 REST ↔ 서비스 gRPC 매핑 완성
- 표준 오류 코드 매핑

### Phase 3 - Collaboration + Inbox Triage

Deliverables:
- Inbox 탭 분리(Notifications/Requests/Mentions/AI Questions)
- Resolve + 딥링크 + 스레드 연계
- Team invite/role 변경 v2 연결

### Phase 4 - AI Coach + Evaluation Hardening

Deliverables:
- 컨텍스트 기반 플로팅 코치
- strict schema 응답 파싱
- fallback/low confidence 제어 + 액션 처리

### Phase 5 - Mobile/A11y + Performance + Polish

Deliverables:
- iPhone 12 mini/15 Pro 대응
- 수평 스크롤/오버플로우/포커스 가림 결함 제거
- 핵심 플로우 성능 및 회귀 테스트 통과

## Test Strategy

### Frontend

1. Board: 드래그/키보드 전환/의존성 토글/상세 편집
2. Sprint Wizard: 생성→백로그→DayPlan→Freeze
3. DSU: 제출→제안→부분 승인→반영
4. Inbox: 필터/resolve/딥링크
5. AI 코치: 컨텍스트/폴백/액션
6. 모바일: 메뉴 접근성/수평 스크롤/오버플로우 없음

### Backend

1. Contract: `/api/v2` request/response schema 고정
2. Integration: Gateway→서비스 위임 경로 검증
3. Domain:
   - dependency cycle 차단
   - freeze 이후 자동 변경 금지
   - DSU apply 원자성
   - low confidence 시 apply 불가
4. Security:
   - 권한 없는 mutate 차단
   - workspace scope 위반 차단
5. Performance:
   - 보드 조회(5k items) p95 측정
   - 평가 API 동시 요청/레이트리밋 폴백

## Risks & Mitigations

1. 브레이킹 API 전환 중 프론트/백엔드 불일치
- Mitigation: v2 contract 먼저 고정, 병행 스모크 후 커트오버

2. Gateway 리팩터링 시 기능 회귀
- Mitigation: 컨트롤러 단위 golden contract test + 단계적 위임

3. LLM 출력 불안정
- Mitigation: strict schema + deterministic fallback + confirm-only apply

4. 모바일 레이아웃 회귀
- Mitigation: 지정 디바이스 e2e + CSS 상대단위 우선 적용

## Done Criteria

1. P0 루프(스프린트 계획→실행→DSU→컨펌 반영→헬스 코칭) E2E 통과
2. Gateway 컨트롤러 인메모리 상태 제거
3. `/api/v2` 계약과 구현 일치
4. LLM 적용이 Draft/Confirm/Apply로만 동작
5. 모바일/접근성 회귀 테스트 통과
