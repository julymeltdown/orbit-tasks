# auth-service

이메일/OAuth 로그인과 JWT 수명주기를 담당하는 인증 서비스입니다.

최종 업데이트: 2026-02-19

## 책임 범위

- 이메일 회원가입/로그인 + 이메일 인증
- OAuth 로그인/연결 (Google/Apple)
- Access/Refresh 토큰 발급 + Refresh 회전
- 비밀번호 재설정 요청/확정
- JWKS 엔드포인트 제공
- 게이트웨이/내부 서비스용 gRPC API 제공

## 인터페이스

- REST 컨트롤러:
  - `/auth/**`
  - `/.well-known/jwks.json`
- gRPC 서버: `AuthServiceGrpc`
- 계약 문서:
  - `specs/001-jwt-auth-msa/contracts/openapi.yaml`
  - `specs/001-jwt-auth-msa/contracts/grpc/`

## local 프로파일

- DB: H2 (`application-local.yml`)
- Refresh 토큰 저장소: 인메모리 (`LocalStubsConfig`)
- 메일 발송기: `auth.email.stub=true`일 때 stub/no-op (local 기본값)

## 주요 환경변수

- DB: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Redis: `REDIS_URL`
- JWT 키: `JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`
- OAuth: `OAUTH_GOOGLE_*`, `OAUTH_APPLE_*`
- gRPC: `GRPC_SERVER_PORT`

## 실행

```bash
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'
```
