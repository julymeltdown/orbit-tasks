# profile-service

프로필 조회/수정/검색 서비스입니다.

최종 업데이트: 2026-02-19

## 현재 동작

- 인바운드 API: gRPC 전용 (`ProfileServiceGrpc`)
- 프로필 조회, 배치 조회, username 검색, 아바타 업로드/다운로드 지원
- JWT Resource Server 검증 적용

## 저장소 현황

- 현재 인메모리 어댑터 사용:
  - `InMemoryProfileRepository`
  - `InMemoryAvatarRepository`
- 관계형 DB 기반 프로필 어댑터는 아직 활성화되지 않았습니다.

## 계약

- gRPC: `specs/001-jwt-auth-msa/contracts/grpc/profile/v1/profile.proto`

## 실행

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
