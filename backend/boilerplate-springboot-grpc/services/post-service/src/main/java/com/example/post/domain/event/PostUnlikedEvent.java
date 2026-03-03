package com.example.post.domain.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PostUnlikedEvent(
        UUID eventId,
        UUID postId,
        UUID userId,
        long likeCount,
        Instant occurredAt
) implements DomainEvent {
    @Override
    public UUID aggregateId() {
        return postId;
    }

    @Override
    public UUID actorId() {
        return userId;
    }

    @Override
    public String eventType() {
        return PostEventType.POST_UNLIKED.name();
    }

    @Override
    public List<String> attributes() {
        return List.of("likeCount");
    }
}
