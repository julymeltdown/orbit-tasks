package com.example.post.application.event;

import java.time.Instant;
import java.util.UUID;

public record EventReplayFilter(
        UUID actorId,
        String eventType,
        String attribute,
        Instant from,
        Instant to,
        Boolean published
) {
}
