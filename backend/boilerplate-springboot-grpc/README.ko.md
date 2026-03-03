# boilerplate-springboot-grpc

Spring Boot 4 + Spring gRPC 기반 마이크로서비스와 JWT 인증, API Gateway(BFF), Next.js 프론트엔드로 구성된 저장소입니다.

최종 업데이트: 2026-02-19

## 현재 구성 요소

| 컴포넌트 | 인바운드 API | 현재 저장소 방식 | 설명 |
|---|---|---|---|
| `services/auth-service` | REST + gRPC | JPA(PostgreSQL, `local`은 H2) + Redis(refresh) | 이메일/OAuth 가입·로그인, JWKS, 비밀번호 재설정 |
| `services/profile-service` | gRPC | 인메모리 저장소 | 프로필 조회/수정/검색 + 아바타 업로드 |
| `services/friend-service` | gRPC | 인메모리 저장소 | 단방향 팔로우 그래프(팔로워/팔로잉/카운트/상태) |
| `services/notification-service` | gRPC | 인메모리 저장소 | 알림 생성/조회 |
| `services/post-service` | gRPC + admin REST(`/admin/events/replay`) | 기본 `post.persistence.mode=jpa` (PostgreSQL, `local`은 H2) | 피드/검색/트렌딩, 좋아요, Outbox+Kafka |
| `services/api-gateway` | REST | 별도 도메인 DB 없음 | BFF, JWT 검증, 하위 gRPC 오케스트레이션 |
| `frontend-sns` | Next.js 웹 | N/A | 게이트웨이 REST 호출 |

## 저장소 구조

```text
.
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── friend-service/
│   ├── notification-service/
│   ├── post-service/
│   └── profile-service/
├── frontend-sns/
├── deploy/k8s/
├── docs/
├── specs/                 # 계약(contracts) 및 관련 산출물
└── TEST_ACCOUNTS.md
```

## 로컬 실행 빠른 시작

필수:
- Java 17
- Node.js 20+
- Docker/Podman (선택: Redis/Postgres/Kafka)

백엔드 실행 예시 순서:

```bash
cd services/auth-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/profile-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/friend-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/notification-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/post-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/api-gateway && ./gradlew bootRun
```

프론트 실행:

```bash
cd frontend-sns
npm install
npm run dev
```

기본 로컬 URL:
- Gateway: `http://localhost:8080`
- Frontend: `http://localhost:5174`

## 계약 문서 위치

최신 계약은 아래 경로를 기준으로 합니다.
- `specs/001-jwt-auth-msa/contracts/openapi.yaml`
- `specs/001-jwt-auth-msa/contracts/grpc/`
- `specs/001-api-gateway-improvements/contracts/gateway-governance.openapi.yaml`
- `specs/002-frontend-gateway/contracts/gateway.openapi.yaml`

## 문서 인덱스

- `docs/README.md`: 현재 유지 문서 목록
- `TEST_ACCOUNTS.md`: 시드 테스트 계정/게시글/팔로우 관계
- `docs/follow-model.md`: 단방향 팔로우 모델 설계
- `docs/POST_EVENTS_ARCHITECTURE.ko.md`: post-service 이벤트 아키텍처
- `docs/POST_EVENTS_OPERATIONS.ko.md`: post-service 이벤트 운영 가이드

시간 경과로 의미가 없어진 스냅샷/계획 문서는 정리했습니다. 과거 이력이 필요하면 Git 히스토리를 참고하세요.
