package com.example.gateway.domain.activation;

import java.time.Instant;
import java.util.Map;

public record ActivationEventRecord(
        String eventId,
        String workspaceId,
        String projectId,
        String userIdHash,
        String sessionId,
        String eventType,
        String route,
        long elapsedMs,
        Map<String, Object> metadata,
        Instant recordedAt
) {
}

