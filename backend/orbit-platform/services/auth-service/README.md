# auth-service

Authentication service for email/OAuth login and JWT lifecycle.

Last updated: 2026-02-19

## Responsibilities

- Email signup/login + verification
- OAuth login/link (Google/Apple)
- Access/refresh token issuance + refresh rotation
- Password reset request/confirm
- JWKS endpoint publishing
- gRPC API for gateway/service calls

## Interfaces

- REST controllers:
  - `/auth/**`
  - `/.well-known/jwks.json`
- gRPC server: `AuthServiceGrpc`
- Contracts:
  - `specs/001-jwt-auth-msa/contracts/openapi.yaml`
  - `specs/001-jwt-auth-msa/contracts/grpc/`

## Local Profile

- DB: H2 (`application-local.yml`)
- Refresh token store: in-memory (`LocalStubsConfig`)
- Email sender: stub/no-op when `auth.email.stub=true` (default local)

## Key Env Vars

- DB: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Redis: `REDIS_URL`
- JWT keys: `JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`
- OAuth: `OAUTH_GOOGLE_*`, `OAUTH_APPLE_*`
- gRPC: `GRPC_SERVER_PORT`

## Run

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
