package com.example.notification.domain;

import java.time.Instant;

public record Notification(
        String id,
        String userId,
        String eventId,
        String actorId,
        String type,
        String payloadJson,
        Instant occurredAt,
        Instant createdAt,
        Instant readAt
) {
}
