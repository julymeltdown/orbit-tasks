# profile-service

Profile read/update/search service.

Last updated: 2026-02-19

## Current Behavior

- Inbound API: gRPC only (`ProfileServiceGrpc`)
- Supports profile lookup, batch lookup, username search, avatar upload/download
- JWT is validated by resource server config

## Persistence Status

- Current implementation uses in-memory adapters:
  - `InMemoryProfileRepository`
  - `InMemoryAvatarRepository`
- No relational profile adapter is active yet

## Contracts

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/profile/v1/profile.proto`

## Run

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
