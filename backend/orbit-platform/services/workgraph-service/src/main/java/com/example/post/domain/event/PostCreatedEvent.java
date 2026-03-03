package com.example.post.domain.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PostCreatedEvent(
        UUID eventId,
        UUID postId,
        UUID authorId,
        String content,
        String visibility,
        Instant createdAt,
        Instant occurredAt
) implements DomainEvent {
    @Override
    public UUID aggregateId() {
        return postId;
    }

    @Override
    public UUID actorId() {
        return authorId;
    }

    @Override
    public String eventType() {
        return PostEventType.POST_CREATED.name();
    }

    @Override
    public List<String> attributes() {
        return List.of("content", "visibility");
    }
}
