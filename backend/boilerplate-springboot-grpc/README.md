# boilerplate-springboot-grpc

Spring Boot 4 + Spring gRPC microservices with JWT auth, API Gateway(BFF), and Next.js frontend.

Last updated: 2026-02-19

## Current Components

| Component | Inbound API | Persistence (current) | Notes |
|---|---|---|---|
| `services/auth-service` | REST + gRPC | JPA (PostgreSQL, `local` uses H2) + Redis(refresh) | Email/OAuth signup/login, JWKS, password reset |
| `services/profile-service` | gRPC | In-memory repository | Profile CRUD/search + avatar upload(binary bytes) |
| `services/friend-service` | gRPC | In-memory repository | One-way follow graph (followers/following/counts/status) |
| `services/notification-service` | gRPC | In-memory repository | Notification create/list |
| `services/post-service` | gRPC + admin REST(`/admin/events/replay`) | `post.persistence.mode=jpa` default (PostgreSQL, `local` uses H2) | Feed/search/trending, like/unlike, outbox + Kafka |
| `services/api-gateway` | REST | No domain DB | BFF, JWT validation, downstream gRPC orchestration |
| `frontend-sns` | Next.js web app | N/A | Calls gateway REST APIs |

## Repository Layout

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
├── specs/                 # contracts and related spec artifacts
└── TEST_ACCOUNTS.md
```

## Quick Start (Local)

Prerequisites:
- Java 17
- Node.js 20+
- Docker/Podman (optional, for Redis/Postgres/Kafka)

Run backend services (example order):

```bash
cd services/auth-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/profile-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/friend-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/notification-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/post-service && ./gradlew bootRun --args='--spring.profiles.active=local'
cd services/api-gateway && ./gradlew bootRun
```

Run frontend:

```bash
cd frontend-sns
npm install
npm run dev
```

Default local URLs:
- Gateway: `http://localhost:8080`
- Frontend: `http://localhost:5174`

## Contracts

Canonical contracts are under:
- `specs/001-jwt-auth-msa/contracts/openapi.yaml`
- `specs/001-jwt-auth-msa/contracts/grpc/`
- `specs/001-api-gateway-improvements/contracts/gateway-governance.openapi.yaml`
- `specs/002-frontend-gateway/contracts/gateway.openapi.yaml`

## Documents

- `docs/README.md`: current documentation index
- `TEST_ACCOUNTS.md`: seeded test users/posts/follow relationships
- `docs/follow-model.md`: one-way follow model design
- `docs/POST_EVENTS_ARCHITECTURE.ko.md`: post-service event architecture
- `docs/POST_EVENTS_OPERATIONS.ko.md`: post-service event operations runbook

Outdated snapshot/plan docs were cleaned up. Use Git history if you need historical context.
