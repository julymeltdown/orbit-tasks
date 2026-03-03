# post-service 이벤트 아키텍처 상세 설계

최종 업데이트: 2026-01-25

이 문서는 post-service의 **도메인 이벤트 → 내부 이벤트 → 외부 이벤트** 흐름과
**Outbox(이벤트 저장소)** 기반 재발행 구조를 상세히 설명한다.

---

## 1) 핵심 원칙

1. **발행해야 할 이벤트는 도메인 이벤트 그 자체**다.
2. **내부 이벤트**는 내부 비관심사를 분리한다.
3. **외부 이벤트**는 외부 시스템과 결합을 제거한다.
4. 이벤트는 **저장(Outbox)되고 재발행 가능**해야 한다.

---

## 2) 전체 흐름 (요약 다이어그램)

```
[Client]
   |
   v
[post-service]
   - PostCreated (Domain Event)
   - Outbox 저장 (BEFORE_COMMIT)
   - internal-events 발행 (AFTER_COMMIT)
        |
        v
   [internal-events topic]
        |\
        | \ (구독자 A) publish-record
        |  \ (구독자 B) external-events
        |   \ (구독자 C) notification
        |
        v
   [external-events topic]
```

---

## 3) 이벤트 계층 정의

### 3.1 도메인 이벤트

- `PostCreatedEvent`
- `PostCommentedEvent`
- `PostLikedEvent`
- `PostUnlikedEvent`

도메인 로직에서 직접 발행되며, 외부 시스템을 의식하지 않는다.

### 3.2 내부 이벤트 (internal-events)

- 내부 비관심사 분리를 위한 이벤트
- 페이로드 확장 가능 (내부 시스템만 소비)
- 예: 알림, 검색 인덱싱, 통계

### 3.3 외부 이벤트 (external-events)

- 외부 시스템과 결합 제거 목적
- **일반화된 스키마만 제공**

외부 이벤트는 “무엇을 하라”가 아니라 “무엇이 일어났다”만 전달한다.

---

## 4) Outbox 저장소 (이벤트 저장소)

### 4.1 저장 타이밍

도메인 트랜잭션 안에서 저장하여 **이벤트 유실을 방지**한다.

- `@TransactionalEventListener(BEFORE_COMMIT)`
- 도메인 변경과 같은 트랜잭션으로 저장되므로 정합성 보장

### 4.2 스키마 예시

```
post_event_outbox(
  event_id UUID PK,
  aggregate_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  attributes TEXT NOT NULL, -- JSON array
  payload TEXT NOT NULL,    -- 내부 이벤트 페이로드
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  published BOOLEAN NOT NULL,
  published_at TIMESTAMP NULL
);

INDEX ix_outbox_created_at_published(created_at, published);
INDEX ix_outbox_event_type_created_at(event_type, created_at);
INDEX ix_outbox_actor_id(actor_id);
```

---

## 5) 내부 이벤트 발행 (AFTER_COMMIT)

도메인 트랜잭션 커밋 후에 internal-events 토픽으로 발행한다.

### 이유
- Kafka 장애가 도메인 트랜잭션 실패로 전파되는 것을 방지
- 대신 **Outbox** 저장으로 유실 방지

---

## 6) publish-record (발행 기록)

internal-events 토픽을 소비하는 **publish-record 구독자**가
Outbox의 published 플래그를 true로 업데이트한다.

이로써 “발행됨” 여부가 기록된다.

---

## 7) 외부 이벤트 발행

internal-events → external-events로 변환하여 발행한다.

### 내부 vs 외부 페이로드

**내부 이벤트**
```json
{
  "eventId": "...",
  "eventType": "POST_CREATED",
  "aggregateId": "...",
  "actorId": "...",
  "attributes": ["content", "visibility"],
  "occurredAt": "...",
  "payload": {
    "content": "...",
    "visibility": "PUBLIC"
  }
}
```

**외부 이벤트**
```json
{
  "eventId": "...",
  "eventType": "POST_CREATED",
  "aggregateId": "...",
  "actorId": "...",
  "attributes": ["content", "visibility"],
  "occurredAt": "..."
}
```

---

## 8) 재발행 전략

### 8.1 자동 재발행

- `published=false` 이면서 일정 시간이 지난 이벤트를 재발행
- 배치 스케줄러가 주기적으로 동작

기본 설정:
- interval: 5분
- delay: 5분

### 8.2 수동 재발행 API

`POST /admin/events/replay`

요청 예시:
```json
{
  "actorId": "11111111-1111-1111-1111-111111111111",
  "eventType": "POST_CREATED",
  "attribute": "content",
  "from": "2026-01-01T00:00:00Z",
  "to": "2026-02-01T00:00:00Z",
  "target": "INTERNAL",
  "limit": 200
}
```

---

## 9) 운영 고려사항

### 9.1 장애 상황
- Kafka 장애: Outbox 저장은 계속됨 → 복구 후 재발행
- 내부 구독자 장애: publish-record가 실패 → published=false로 남음

### 9.2 보장 수준
- at-least-once 보장
- 중복 가능 → 소비자 idempotent 처리 필요

### 9.3 확장성
- 토픽 파티션 추가 가능
- consumer group scale-out 가능

---

## 10) 테스트 전략

- **Outbox 저장 테스트**: 도메인 이벤트 발생 시 저장 여부 확인
- **Publish record 테스트**: internal-events 소비 후 published=true 확인
- **Replay 테스트**: 필터 조건 재발행 로직 검증

---

## 11) 코드 위치

- 이벤트 모델: `services/post-service/src/main/java/com/example/post/domain/event/`
- Outbox 저장: `services/post-service/src/main/java/com/example/post/adapters/out/persistence/`
- Kafka 발행: `services/post-service/src/main/java/com/example/post/adapters/out/kafka/`
- Kafka 구독: `services/post-service/src/main/java/com/example/post/adapters/in/kafka/`
- 재발행 스케줄러: `services/post-service/src/main/java/com/example/post/application/event/EventRepublishScheduler.java`

