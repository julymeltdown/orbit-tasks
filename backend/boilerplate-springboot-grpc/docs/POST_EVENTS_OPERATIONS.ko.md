# post-service 이벤트 운영 가이드 (Kafka + Outbox)

최종 업데이트: 2026-01-25

이 문서는 k3s 환경에서 Kafka + post-service 이벤트 파이프라인을
운영/검증/복구하는 방법을 설명한다.

---

## 1) 배포 구성

### 1.1 Kafka (k3s)
- 리소스: `deploy/k8s/k3s-random/kafka.yaml`
- 이미지: `apache/kafka:3.7.0`
- KRaft 단일 노드

### 1.2 post-service
- 이벤트 활성화: `POST_KAFKA_ENABLED=true`
- Kafka 연결: `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`
- Outbox 재발행: `POST_EVENTS_REPUBLISH_ENABLED=true`

---

## 2) 토픽 생성

```
kubectl -n boilerplate-random exec pod/kafka-XXXX -- \
  /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:9092 \
  --create --if-not-exists \
  --topic post.internal-events --partitions 3 --replication-factor 1

kubectl -n boilerplate-random exec pod/kafka-XXXX -- \
  /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:9092 \
  --create --if-not-exists \
  --topic post.external-events --partitions 3 --replication-factor 1
```

---

## 3) 이벤트 발행 검증

### 3.1 게시글 생성
```
TOKEN=$(curl -s -X POST http://121.130.253.119:32391/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hana@example.com","password":"Passw0rd!"}' | jq -r '.accessToken')

curl -s -X POST http://121.130.253.119:32391/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"content":"event-check","visibility":"PUBLIC"}'
```

### 3.2 internal-events 확인
```
kubectl -n boilerplate-random exec pod/kafka-XXXX -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka:9092 \
  --topic post.internal-events \
  --from-beginning --max-messages 20 --timeout-ms 5000
```

### 3.3 external-events 확인
```
kubectl -n boilerplate-random exec pod/kafka-XXXX -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka:9092 \
  --topic post.external-events \
  --from-beginning --max-messages 20 --timeout-ms 5000
```

---

## 4) Outbox 재발행 확인

### 4.1 자동 재발행 로그
```
kubectl -n boilerplate-random logs deploy/post-service | rg "Event republish scan complete"
```

### 4.2 수동 재발행 API
```
POST /admin/events/replay

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

## 5) 운영 체크리스트

- Kafka pod Ready 확인
- 토픽 생성 확인
- Outbox 테이블 생성 확인
- internal-events → external-events 전파 확인
- publish-record 로그 확인

---

## 6) 장애 대응

### Kafka 다운
- Outbox에 이벤트는 저장됨
- Kafka 복구 후 재발행 스케줄러가 처리

### publish-record 장애
- published=false 상태 유지 → 자동 재발행 대상

---

## 7) 주의사항

- Kafka 콘솔 툴 실행 후 5초 timeout 로그는 정상 동작 (consumer 종료 시 발생)
- `kustomization.yaml`은 직접 `kubectl apply` 대상이 아니므로
  envsubst 적용 시 제외해야 함

---

## 8) 환경 변수 요약

| 변수 | 설명 | 기본 |
|------|------|------|
| POST_KAFKA_ENABLED | 이벤트 발행 활성화 | true |
| KAFKA_BOOTSTRAP_SERVERS | Kafka 브로커 | kafka:9092 |
| POST_EVENTS_INTERNAL_TOPIC | internal-events 토픽 | post.internal-events |
| POST_EVENTS_EXTERNAL_TOPIC | external-events 토픽 | post.external-events |
| POST_EVENTS_REPUBLISH_ENABLED | 재발행 활성화 | true |
| POST_EVENTS_REPUBLISH_INTERVAL | 재발행 간격 | PT5M |
| POST_EVENTS_REPUBLISH_DELAY | 지연 기준 | PT5M |

