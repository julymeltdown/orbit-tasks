# api-gateway

REST BFF for web/mobile clients.

Last updated: 2026-02-19

## What It Does

- Validates JWT (resource server)
- Exposes browser-friendly REST endpoints
- Calls downstream microservices over gRPC
- Handles refresh cookie issue/clear flows

## Main REST Routes

- Auth
  - `POST /auth/email/signup`
  - `POST /auth/email/verify`
  - `POST /auth/email/check`
  - `POST /auth/password/reset/request`
  - `POST /auth/password/reset/confirm`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/oauth/{provider}/authorize`
  - `GET /auth/oauth/{provider}/callback`
  - `POST /auth/oauth/{provider}/link`
- Profile
  - `GET /api/profile/{userId}`
  - `GET /api/profile/username/{username}`
  - `POST /api/profile/batch`
  - `GET /api/profile/search`
  - `POST /api/profile/avatar`
  - `GET /api/profile/avatar/{userId}`
  - `PUT /api/profile/{userId}`
- Posts/Feed
  - `GET /api/feed`
  - `GET /api/posts/{postId}`
  - `GET /api/posts/author/{authorId}`
  - `GET /api/posts/search`
  - `GET /api/posts/trending`
  - `POST /api/posts`
  - `POST /api/posts/{postId}/comments`
  - `POST /api/posts/{postId}/likes`
  - `DELETE /api/posts/{postId}/likes`
- Follows
  - `POST /api/follows`
  - `DELETE /api/follows/{targetUserId}`
  - `GET /api/follows/followers`
  - `GET /api/follows/following`
  - `GET /api/follows/counts`
  - `GET /api/follows/status`
- Notifications
  - `GET /api/notifications`
- Optional aggregate endpoint
  - `GET /api/aggregate/{routeKey}`

Admin governance routes exist under `/admin/**`.

## Configuration

Key env vars:

- gRPC targets
  - `GATEWAY_AUTH_GRPC_TARGET`
  - `GATEWAY_PROFILE_GRPC_TARGET`
  - `GATEWAY_POST_GRPC_TARGET`
  - `GATEWAY_FRIEND_GRPC_TARGET`
  - `GATEWAY_NOTIFICATION_GRPC_TARGET`
- JWT
  - `GATEWAY_JWT_PUBLIC_KEY_PEM`
  - `GATEWAY_JWKS_URL`
- CORS
  - `GATEWAY_CORS_ALLOWED_ORIGINS`
- Refresh cookie
  - `GATEWAY_REFRESH_COOKIE`
  - `GATEWAY_REFRESH_COOKIE_DOMAIN`
  - `GATEWAY_REFRESH_COOKIE_SECURE`
  - `GATEWAY_REFRESH_COOKIE_MAX_AGE`

## Run

```bash
./gradlew test
./gradlew bootRun
```
