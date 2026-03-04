# Research: Orbit Schedule Enterprise UI/UX Re-Architecture

## Scope

본 리서치는 `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/spec.md`를 구현하기 위한 기술/구조 의사결정을 정리한다.  
중점은 다음 세 가지다.

1. IA/UX 재설계의 구조적 기준
2. 헥사고날 아키텍처 및 계약 정합성
3. 테스트 커버리지/품질 게이트의 현실적 도입 방식

## Codebase Facts Used

1. 서비스 15개 존재, 이 중 일부 신규 서비스는 테스트/arch test가 없다.
2. 일부 서비스는 `gradlew`가 없어 서비스 독립 실행 원칙이 깨져 있다.
3. `team-service`, `workgraph-service`는 `com.example.*`와 `com.orbit.*` 패키지가 혼재한다.
4. gateway 경로 계약 파일과 실제 endpoint prefix의 불일치 가능성이 존재한다.
5. 프론트 라우팅은 기능 페이지가 많지만 내비 중복으로 IA 혼선이 크다.

## Decisions

### Decision 1: 내비게이션은 Scope와 View로 명시 분리

**Decision**: 좌측 글로벌 내비는 Scope(워크스페이스/프로젝트/관리영역)만 담당하고, 프로젝트 내부 상단 탭은 View(Board/Table/Timeline/Calendar/Dashboard)만 담당한다.

**Rationale**:
- 중복 내비를 제거하면 정보구조 학습 비용이 가장 크게 감소한다.
- 동일 데이터의 표현 전환은 페이지 이동보다 로컬 탭 패턴이 적합하다.

**Alternatives considered**:
- 기존처럼 페이지 중심 라우팅 유지
- 우측 AI 패널에서 보조 내비 제공 유지

### Decision 2: Assistant 표면 단일화

**Decision**: AI는 하나의 주요 표면(우측 드로어/패널)만 유지하고 제품 내비 라벨은 제거한다.

**Rationale**:
- AI가 내비와 경쟁하면 사용자는 "어디서 무엇을 해야 하는지"를 잃는다.
- 컨텍스트 기반 보조로 역할을 고정해야 신뢰성과 예측 가능성이 높아진다.

**Alternatives considered**:
- 우측 고정 패널 + 플로팅 챗 병행
- 현재처럼 패널 내부에 product-level 링크 유지

### Decision 3: 의존성 관리는 기본 보드에서 분리

**Decision**: 보드 기본 툴바에서 dependency editor를 제거하고, 항목 상세 또는 타임라인 전용 모드에서만 편집한다.

**Rationale**:
- 고빈도 흐름(상태 이동/간단 수정)과 저빈도 고급 기능(의존성 설계)을 분리해야 작업 집중이 향상된다.

**Alternatives considered**:
- 보드 상단 고정 dependency 폼 유지
- dependency 전용 페이지 별도 생성

### Decision 4: gateway 일정평가는 단일 서비스 소스로 수렴

**Decision**: 일정평가 로직은 `schedule-intelligence-service`를 단일 소스로 사용하고 gateway의 임시 스텁 구현은 제거한다.

**Rationale**:
- 동일 도메인 로직의 이중 구현은 결과 불일치와 운영 혼란을 만든다.
- AI 정책, confidence, fallback 제어는 평가 서비스에 집중되어야 한다.

**Alternatives considered**:
- gateway 스텁 유지 후 점진 전환
- gateway와 서비스 이중 실행 후 선택

### Decision 5: 헥사고날 경계는 ArchUnit으로 서비스별 강제

**Decision**: 영향 서비스 모두에 ArchUnit 경계 테스트를 필수화한다.

**Rationale**:
- 신규 서비스군(agile/collab/deeplink/integration-migration/schedule-intelligence)의 경계 일탈을 조기에 차단한다.
- 헌법 원칙 IV를 기계적으로 검증 가능하게 만든다.

**Alternatives considered**:
- 리뷰 체크리스트만으로 수동 점검
- 핵심 서비스 일부만 ArchUnit 적용

### Decision 6: 서비스 독립 실행성 복구

**Decision**: `gradlew` 부재 서비스에 wrapper를 추가하고, 서비스별 단독 테스트 명령을 확정한다.

**Rationale**:
- 글로벌 gradle 미설치 환경에서 서비스 테스트 불가 문제가 이미 확인되었다.
- 독립 실행성은 마이크로서비스 품질 게이트의 전제다.

**Alternatives considered**:
- 루트 단일 gradle wrapper에 의존
- CI에서만 빌드/테스트 보장

### Decision 7: 커버리지는 "리포트"가 아닌 "게이트"로 전환

**Decision**: JaCoCo 리포트 생성 단계에서 `JacocoCoverageVerification` 임계치를 추가한다.

**Rationale**:
- 현재는 보고서만 생성되고 실패 기준이 없어 품질 관리가 수동이다.
- 점진 임계치(초기 line 70/branch 55)로 현실적인 도입이 가능하다.

**Alternatives considered**:
- 커버리지 게이트 없이 유지
- 90% 이상 고임계치 즉시 도입

### Decision 8: 계약 파일 우선 정렬(OpenAPI canonical)

**Decision**: gateway 공개 경로의 canonical source를 OpenAPI로 두고 route-contract/policy/aggregation 파일을 동기화한다.

**Rationale**:
- 현재 계약 파일과 코드 경로 간 어긋남이 운영 혼란을 유발할 수 있다.
- 계약 테스트 자동화 기준점이 명확해진다.

**Alternatives considered**:
- 코드 우선 유지 후 문서 사후 반영
- route-contract를 기준으로 OpenAPI 생성

## Consequences

### Positive

1. 사용성 측면에서 내비 혼선이 크게 줄어든다.
2. 도메인 책임이 명확해져 운영/디버깅 비용이 감소한다.
3. 헥사고날 경계와 테스트 커버리지가 정량적으로 관리된다.

### Negative / Trade-offs

1. 초기 리팩터링 범위가 넓어 단기 개발속도가 일시 저하될 수 있다.
2. 빅뱅 전환 전략으로 릴리스 창에서 검증 압력이 커진다.
3. package rename/계약 정렬 중 회귀 위험이 있다.

## Open Questions Resolved

- Q: 내비 구조를 페이지 중심으로 유지할지?  
  A: Scope/View 분리로 전환.

- Q: AI를 별도 내비로 둘지?  
  A: 컨텍스트 코치 표면으로 단일화.

- Q: 커버리지 게이트를 언제 도입할지?  
  A: 이번 기능 구현 트랙에 포함해 즉시 도입(단계 임계치 방식).

- Q: 서비스 독립 실행 문제를 CI에만 맡길지?  
  A: 로컬 독립 실행 가능하도록 wrapper 정비.
