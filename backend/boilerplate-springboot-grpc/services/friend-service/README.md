# friend-service

One-way follow graph service.

Last updated: 2026-02-19

## Current Behavior

- Inbound API: gRPC only (`FriendServiceGrpc`)
- Model: follower -> following (one-way)
- Supports follow/unfollow, followers/following list, counts, status checks
- JWT is validated by resource server config

## Persistence Status

- Current implementation is in-memory repository (`InMemoryFollowRepository`)
- Designed with ports/adapters for future DB adapter migration

## Contracts

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/friend/v1/friend.proto`

## Run

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
