package com.example.post.application.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StoredEvent(
        UUID eventId,
        String eventType,
        UUID aggregateId,
        UUID actorId,
        List<String> attributes,
        String payload,
        Instant occurredAt,
        Instant createdAt,
        boolean published,
        Instant publishedAt
) {
}
