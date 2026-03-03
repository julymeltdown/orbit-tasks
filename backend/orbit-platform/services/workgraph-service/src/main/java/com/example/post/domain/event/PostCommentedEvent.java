package com.example.post.domain.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PostCommentedEvent(
        UUID eventId,
        UUID postId,
        UUID commentId,
        UUID authorId,
        String content,
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
        return PostEventType.POST_COMMENTED.name();
    }

    @Override
    public List<String> attributes() {
        return List.of("comment");
    }
}
