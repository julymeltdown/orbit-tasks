package com.example.post.domain.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DomainEvent {
    UUID eventId();

    UUID aggregateId();

    UUID actorId();

    String eventType();

    List<String> attributes();

    Instant occurredAt();
}
