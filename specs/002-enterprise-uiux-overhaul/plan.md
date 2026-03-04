# Implementation Plan: Orbit Schedule Enterprise UI/UX Re-Architecture

**Branch**: `002-enterprise-uiux-overhaul` | **Date**: 2026-03-04 | **Spec**: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/spec.md`  
**Input**: Feature specification from `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/spec.md`

## Summary

이번 기능은 "페이지 중심 UI"를 "객체 중심 운영 UI"로 재구축한다.  
핵심 구현 전략은 다음과 같다.

1. App Shell 내비게이션을 `Scope(글로벌)`와 `View(로컬)`로 분리한다.
2. Project Shell 하나를 기준으로 Board/Table/Timeline/Calendar/Dashboard를 동등한 뷰로 통합한다.
3. 의존성/AI/거버넌스 기능을 기본 캔버스에서 분리해 점진적 공개로 재배치한다.
4. 백엔드는 gateway 스텁/잔존 SNS 도메인을 정리하고 Orbit 도메인 계약을 우선한다.
5. 헥사고날 아키텍처 준수와 커버리지 게이트를 명시적 품질 기준으로 적용한다.

## Codebase Scan Baseline

### A. 서비스/테스트/아키텍처 테스트 현황 (실측)

| Service | Main Java | Test Java | Arch Test |
|---|---:|---:|---:|
| api-gateway | 119 | 2 | 1 |
| identity-access-service | 96 | 18 | 1 |
| profile-service | 24 | 10 | 1 |
| team-service | 24 | 11 | 1 |
| workgraph-service | 90 | 19 | 1 |
| agile-ops-service | 6 | 0 | 0 |
| collaboration-service | 5 | 0 | 0 |
| deep-link-service | 4 | 0 | 0 |
| schedule-intelligence-service | 10 | 2 | 0 |
| integration-migration-service | 5 | 0 | 0 |
| notification-service | 21 | 5 | 1 |
| platform-event-kit | 7 | 0 | 0 |

### B. 서비스 독립 실행 현황

헌법상 "서비스 독립 빌드/실행"이 요구되나, 일부 서비스는 `gradlew`가 없다.

- `gradlew` 있음: api-gateway, auth-service, identity-access-service, notification-service, post-service, profile-service, team-service, workgraph-service, friend-service, platform-event-kit
- `gradlew` 없음: agile-ops-service, collaboration-service, deep-link-service, integration-migration-service, schedule-intelligence-service

### C. 구조 일관성 리스크

1. `team-service`, `workgraph-service` 내부에 `com.example.friend`, `com.example.post`와 `com.orbit.*`가 혼재한다.
2. 일부 신규 서비스는 `adapters/out`이 없거나 테스트가 없어 헥사고날 완결성이 약하다.
3. `api-gateway`에 스텁 성격의 일정평가 컨트롤러가 남아 서비스 책임 경계가 모호하다.

### D. 프론트엔드 현황

1. 라우트는 다수 존재하나 내비 중복(`All Pages`, 우측 링크군)으로 IA 혼선이 발생한다.
2. 테스트는 `vitest` 기반 최소 단위(`profileCompletion`)만 실행되고, 핵심 UI 상호작용 테스트가 부족하다.
3. `tests/` 하위 계약/통합/E2E 테스트 자산은 존재하지만, monorepo 통합 실행 스크립트는 약하다.

## Technical Context

**Language/Version**: Java 17 (Spring Boot services), TypeScript 5.9 + React 18 (Vite)  
**Primary Dependencies**: Spring Boot 4.0.1, Spring Security 7 (Boot 4 계열), Spring gRPC 1.0.2, React Router, Zustand, dnd-kit, Vitest, Playwright  
**Storage**: PostgreSQL, Redis, local JSON/YAML contracts  
**Testing**: JUnit5 + ArchUnit + JaCoCo (backend), Vitest (frontend/unit+integration), Playwright (e2e/visual), contract tests (`tests/contract`)  
**Target Platform**: Responsive Web (Desktop + Mobile Safari/Chrome), K3s 배포 환경  
**Project Type**: Web application (frontend + backend microservices + API gateway)  
**Performance Goals**: App Shell 첫 상호작용 p75 2.5s 이내(Desktop), 보드 상태 이동 체감 지연 150ms 이내, API p95 500ms 이내  
**Constraints**:
- 헥사고날 경계(ports/adapters) 준수
- 서비스별 독립 빌드/테스트 명령 확보
- `gpt-5.2-pro` 기반 AI 호출은 폴백 및 정책 강제 필요
- 모바일 오버플로우/포커스 가림 결함 0건 목표  
**Scale/Scope**: 워크스페이스 다중 운영, 프로젝트 다수, Work Item 5k+ 기준 UI 안정성

## Official Documentation References (Constitution Principle II)

- Spring Security Reference (7.x via Boot 4 line): `https://docs.spring.io/spring-security/reference/`
- Spring gRPC Reference (1.0.x): `https://docs.spring.io/spring-grpc/reference/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

기준 문서: `/home/lhs/dev/tasks/backend/orbit-platform/.specify/memory/constitution.md`

### Gate Review (Pre-Design)

| Gate | Rule | Status | Findings | Remediation in this plan |
|---|---|---|---|---|
| G1 | Service autonomy & independent lifecycle | FAIL | 5개 서비스에 `gradlew` 부재로 독립 실행 불가 | Phase 1에서 wrapper/공통 실행 규약 정비 |
| G2 | Official docs first (Security/gRPC) | PASS | 버전/공식 URL 문서화 가능 | Plan에 참조 URL 고정 |
| G3 | Versioned contracts | PARTIAL | 계약 파일은 존재하나 gateway route-contract와 실 API 경로 불일치 존재 | Phase 1 계약 재정렬 및 버전 정책 명시 |
| G4 | Hexagonal architecture enforcement | PARTIAL | 일부 서비스에 arch test 부재/패키지 혼재 | Phase 1에서 ArchUnit + 패키지 정규화 작업 포함 |

### Required Quality Gates Before Implementation PR

1. 신규/변경 서비스는 `gradlew test` 단독 실행 가능해야 함
2. 각 서비스에 최소 1개 ArchUnit 경계 테스트가 있어야 함
3. JaCoCo 리포트 생성뿐 아니라 `JacocoCoverageVerification` 임계치가 적용되어야 함
4. gateway 공개 API와 계약 파일(OpenAPI/route-contract)이 동기화되어야 함

## Project Structure

### Documentation (this feature)

```text
/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── gateway-uiux.openapi.yaml
└── tasks.md  # /speckit.tasks에서 생성
```

### Source Code (repository root)

```text
/home/lhs/dev/tasks/
├── backend/
│   ├── orbit-platform/
│   │   ├── services/
│   │   │   ├── api-gateway/
│   │   │   ├── identity-access-service/
│   │   │   ├── profile-service/
│   │   │   ├── team-service/
│   │   │   ├── workgraph-service/
│   │   │   ├── agile-ops-service/
│   │   │   ├── collaboration-service/
│   │   │   ├── deep-link-service/
│   │   │   ├── schedule-intelligence-service/
│   │   │   ├── integration-migration-service/
│   │   │   └── notification-service/
│   │   └── docs/
│   └── boilerplate-springboot-grpc/
├── frontend/
│   └── orbit-web/
│       ├── src/
│       │   ├── app/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/
│       │   ├── design/
│       │   └── stores/
│       └── package.json
└── tests/
    ├── contract/
    ├── integration/
    └── e2e/
```

**Structure Decision**: 기존 모노레포 구조를 유지하되, 이번 기능은 `frontend/orbit-web`과 `backend/orbit-platform/services/*`를 함께 수정하는 수직 슬라이스 방식으로 구현한다.

## Implementation Phases

### Phase 0 - Research & Design Decisions

Output: `research.md`

1. IA 분리 전략(Scope vs View) 확정
2. Assistant 표면 단일화 전략 확정
3. 의존성 편집 위치 재정의(보드 기본영역에서 분리)
4. 헥사고날/테스트 커버리지 강화 기준 확정
5. 계약 파일-실구현 경로 불일치 해결 전략 확정

### Phase 1 - Domain & Contract Design

Outputs: `data-model.md`, `contracts/gateway-uiux.openapi.yaml`, `quickstart.md`

1. 객체 모델(Workspace/Project/ViewConfig/WorkItem/Sprint/DSU/Thread/Inbox/Portfolio/Evaluation) 정식화
2. API 계약 표준화(중복/잔존 SNS 경로 제거 계획 포함)
3. 사용자 핵심 플로우 기반 quickstart 정의
4. agent context 업데이트(`update-agent-context.sh codex`)

### Phase 2 - Delivery Plan for /speckit.tasks

`tasks.md`에서 아래 6개 트랙으로 분해한다.

1. IA/AppShell/Router 정비 트랙
2. Project Shell 멀티뷰 일관화 트랙
3. Sprint/DSU/Inbox 상호연결 트랙
4. Portfolio/Insight/AI 패널 UX 트랙
5. Backend 계약/도메인 정합성 트랙
6. 테스트/커버리지/아키텍처 게이트 트랙

## Hexagonal Architecture Enforcement Plan

### Target Services (이번 기능 직접 영향)

- api-gateway
- identity-access-service
- team-service
- workgraph-service
- agile-ops-service
- collaboration-service
- schedule-intelligence-service
- deep-link-service

### Enforcement Actions

1. 서비스별 패키지 루트 통일(`com.orbit.<service>`) 및 legacy 루트 축소
2. `application` 레이어에서 adapter 구현 타입 참조 제거
3. inbound adapter는 application port만 호출
4. outbound adapter는 application port 구현으로 제한
5. ArchUnit 규칙 통일 템플릿 도입

### Known Gaps to Fix

- `team-service`의 `TeamLifecycleService`가 adapter entity를 직접 참조
- 일부 신규 서비스(agile/collaboration/deep-link/integration-migration/schedule-intelligence)에 arch test 부재
- 일부 신규 서비스에 테스트 0건

## Test Coverage Strategy

### Baseline

- Backend: JaCoCo 리포트는 대부분 존재, 강제 임계치 없음
- Frontend: 단위 테스트 1파일(2 tests), 핵심 화면 테스트 부족
- Cross-service: `tests/contract`, `tests/integration`, `tests/e2e` 자산 존재

### Coverage Gates (이번 기능 목표)

1. Backend service line coverage >= 70%, branch >= 55% (`JacocoCoverageVerification`)
2. 각 핵심 서비스당 ArchUnit 테스트 >= 1
3. Frontend 핵심 페이지(Board/Sprint/Inbox/AppShell) 컴포넌트 테스트 추가
4. E2E 최소 3개 핵심 시나리오(로그인 진입, 보드 상태 이동, 스프린트+DSU)
5. 계약 테스트는 새/변경 API 모두 추가

### CI/Execution Rules

1. 서비스별 `./gradlew test jacocoTestReport` 실행 가능한 상태 확보
2. 프론트 `npm test` + 빌드 통과
3. 계약/통합/E2E 테스트는 변경 영역 기반 선택 실행 + 야간 전체 실행

## API and Contract Alignment Plan

### High-Risk Mismatch Areas

1. `route-contracts.yml` 경로와 실제 gateway endpoint prefix 불일치(`/api` 유무)
2. aggregation 기본값(`feed-summary`) fallback이 런타임에 노출될 수 있음
3. schedule evaluation이 gateway 스텁과 schedule-intelligence 서비스에 이중 존재

### Alignment Actions

1. gateway 공개 REST를 OpenAPI 계약에 우선 정렬
2. `route-contracts.yml`를 OpenAPI 경로와 동일한 canonical path로 일치
3. 일정평가는 schedule-intelligence 단일 소스로 수렴
4. deprecated path 목록과 제거 시점 명시

## Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| IA 대개편으로 사용자 혼란 | 초기 이탈/문의 증가 | 내비 단순화 + 빈상태 가이드 + 릴리스 노트 |
| 서비스 경계 정리 중 회귀 | 기능 불능 | 계약 테스트 선행 + 단계별 스모크 |
| Arch/coverage gate 도입 시 빌드 실패 증가 | 개발 속도 저하 | 임계치 단계 적용(초기 낮게 시작 후 상향) |
| 모바일 레이아웃 회귀 | 핵심 사용성 저하 | iPhone 12 mini/15 Pro 회귀 체크리스트 고정 |
| AI 실패/품질 변동 | 신뢰 저하 | 폴백 UX + confidence 기준 + 근거 링크 강제 |

## Post-Design Constitution Re-Check (Expected)

Phase 1 산출물 반영 후 목표 상태:

1. G1: PASS (모든 목표 서비스 wrapper/실행 규약 보유)
2. G2: PASS (공식 문서/버전 참조 plan 및 contracts에 명시)
3. G3: PASS (OpenAPI + route contract + proto 버전 정합)
4. G4: PASS (핵심 서비스 아키텍처 테스트 및 경계 준수)

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Legacy package 공존(`com.example.*` + `com.orbit.*`) | 기존 기능 유지 중 전환 필요 | 즉시 전면 rename은 회귀 위험이 큼 |
| 일부 서비스 gradlew 부재 | 초기 스캐폴딩 속도 우선 결과 | 글로벌 gradle 의존은 헌법의 서비스 독립 원칙 위반 |
| JaCoCo 리포트만 있고 gate 없음 | 초기 개발 단계에서 속도 우선 | 품질 게이트 부재로 회귀 누적 위험이 큼 |

## Implementation Validation & Release Notes (2026-03-04)

### Validation Commands

1. Frontend unit + build
   - `cd frontend/orbit-web && npm test && npm run build`
   - Result: PASS
2. Backend service tests
   - `./gradlew test --no-daemon` on:
     - api-gateway
     - identity-access-service
     - workgraph-service
     - agile-ops-service
     - collaboration-service
     - deep-link-service
     - schedule-intelligence-service
     - integration-migration-service
   - Result: PASS
3. Contract + integration suites
   - `cd frontend/orbit-web && npx vitest run --root ../.. tests/contract tests/integration`
   - Result: PASS (38 files, 61 tests)
4. E2E smoke
   - `cd tests/e2e && npx playwright test -c playwright.config.ts us7-deeplink-auth-bounce.spec.ts --project=chromium`
   - Result: PASS

### Release Notes Summary

1. Scope-first/app-shell navigation with shared project view tabs and filter context finalized.
2. Project multiview parity completed for Board/Table/Timeline/Calendar/Dashboard.
3. Board dependency inspector, keyboard fallback actions, and drag cohesion styling applied.
4. Sprint no-active empty-state and structured DSU composition flow connected.
5. Inbox triage filters + resolve actions + deep-link bounce handling stabilized.
6. Portfolio selector-first flow and drilldown links implemented.
7. Governance UX improved with admin policy tabs, audit filtering/search, and export flow.
8. Route contracts, governance OpenAPI, and feature contract snapshot synchronized.
9. Wrapper/coverage/architecture test baseline hardened across targeted backend services.
