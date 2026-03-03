# friend-service

단방향 팔로우 그래프 서비스입니다.

최종 업데이트: 2026-02-19

## 현재 동작

- 인바운드 API: gRPC 전용 (`FriendServiceGrpc`)
- 모델: follower -> following (단방향)
- follow/unfollow, 팔로워/팔로잉 목록, 카운트, 상태 조회 지원
- JWT Resource Server 검증 적용

## 저장소 현황

- 현재 구현은 인메모리 저장소(`InMemoryFollowRepository`)입니다.
- 포트/어댑터 구조로 향후 DB 어댑터 교체를 고려한 상태입니다.

## 계약

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/friend/v1/friend.proto`

## 실행

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
