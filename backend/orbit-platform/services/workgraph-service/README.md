# post-service

Post/feed service with event outbox and optional Kafka publication.

Last updated: 2026-02-19

## Responsibilities

- Create posts/comments
- Feed, author posts, search, trending
- Like/unlike and engagement batch reads (N+1 avoidance)
- Outbox event storage + internal/external event publication
- gRPC calls to profile/friend/notification services

## Interfaces

- gRPC server: `PostServiceGrpc`
- Admin REST: `POST /admin/events/replay`
- Contracts:
  - `specs/001-jwt-auth-msa/contracts/grpc/post/v1/post.proto`

## Persistence Modes

- Default: `post.persistence.mode=jpa` (recommended)
  - PostgreSQL in non-local profiles
  - H2 in `local` profile
- Optional local/test fallback: `post.persistence.mode=memory`
  - Uses `InMemoryPostRepository`

Likes/counters:
- Default local/test: in-memory like repository
- Optional Redis path via `POST_REDIS_ENABLED=true`

## Eventing

- Outbox + republish scheduler built-in
- Kafka publication toggled by `POST_KAFKA_ENABLED`
- Details:
  - `docs/POST_EVENTS_ARCHITECTURE.ko.md`
  - `docs/POST_EVENTS_OPERATIONS.ko.md`

## Key Env Vars

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `AUTH_JWKS_URL`
- `PROFILE_GRPC_TARGET`, `FRIEND_GRPC_TARGET`, `NOTIFICATION_GRPC_TARGET`
- `POST_PERSISTENCE_MODE`
- `POST_KAFKA_ENABLED`, `KAFKA_BOOTSTRAP_SERVERS`
- `POST_REDIS_ENABLED`, `REDIS_URL`

## Run

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
