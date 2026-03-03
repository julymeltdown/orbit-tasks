# post-service

게시물/피드 서비스이며 이벤트 Outbox와 Kafka 발행 경로를 포함합니다.

최종 업데이트: 2026-02-19

## 책임 범위

- 게시물/댓글 생성
- 피드/작성자 게시글/검색/트렌딩
- 좋아요/좋아요 취소 + 배치 집계(N+1 회피)
- Outbox 저장 + internal/external 이벤트 발행
- profile/friend/notification gRPC 호출

## 인터페이스

- gRPC 서버: `PostServiceGrpc`
- Admin REST: `POST /admin/events/replay`
- 계약 문서:
  - `specs/001-jwt-auth-msa/contracts/grpc/post/v1/post.proto`

## 저장 모드

- 기본: `post.persistence.mode=jpa` (권장)
  - non-local: PostgreSQL
  - `local`: H2
- 선택(로컬/테스트): `post.persistence.mode=memory`
  - `InMemoryPostRepository` 사용

좋아요/카운터:
- local/test 기본: 인메모리 like 저장소
- `POST_REDIS_ENABLED=true`로 Redis 경로 사용 가능

## 이벤트

- Outbox + 재발행 스케줄러 내장
- `POST_KAFKA_ENABLED`로 Kafka 발행 on/off
- 상세 문서:
  - `docs/POST_EVENTS_ARCHITECTURE.ko.md`
  - `docs/POST_EVENTS_OPERATIONS.ko.md`

## 주요 환경변수

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `AUTH_JWKS_URL`
- `PROFILE_GRPC_TARGET`, `FRIEND_GRPC_TARGET`, `NOTIFICATION_GRPC_TARGET`
- `POST_PERSISTENCE_MODE`
- `POST_KAFKA_ENABLED`, `KAFKA_BOOTSTRAP_SERVERS`
- `POST_REDIS_ENABLED`, `REDIS_URL`

## 실행

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
