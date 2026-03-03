package com.example.post.application.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InternalEventMessage(
        UUID eventId,
        String eventType,
        UUID aggregateId,
        UUID actorId,
        List<String> attributes,
        Instant occurredAt,
        String payload
) {
}
