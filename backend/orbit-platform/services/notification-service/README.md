# notification-service

Notification delivery/list service.

Last updated: 2026-02-19

## Current Behavior

- Inbound API: gRPC only (`NotificationServiceGrpc`)
- Supports notification create/list
- JWT is validated by resource server config

## Persistence Status

- Current implementation uses `InMemoryNotificationRepository`
- DB-backed notification adapter is not active yet

## Contracts

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/notification/v1/notification.proto`

## Run

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
