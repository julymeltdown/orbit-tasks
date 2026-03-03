package com.example.post.domain;

import java.util.UUID;

public record NotificationRequest(
        UUID userId,
        String type,
        String payloadJson,
        UUID eventId,
        UUID actorId,
        String occurredAt) {
}
