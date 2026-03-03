# notification-service

알림 생성/조회 서비스입니다.

최종 업데이트: 2026-02-19

## 현재 동작

- 인바운드 API: gRPC 전용 (`NotificationServiceGrpc`)
- 알림 생성/목록 조회 지원
- JWT Resource Server 검증 적용

## 저장소 현황

- 현재 `InMemoryNotificationRepository` 사용
- DB 기반 알림 어댑터는 아직 활성화되지 않았습니다.

## 계약

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/notification/v1/notification.proto`

## 실행

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
