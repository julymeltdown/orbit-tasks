package com.orbit.deeplink.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

public record DeepLinkToken(
        UUID id,
        String token,
        UUID workspaceId,
        String targetType,
        UUID targetId,
        String targetPath,
        String createdBy,
        Instant expiresAt,
        Instant consumedAt,
        Instant createdAt
) {
    public DeepLinkToken {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Deep link token is required");
        }
        if (workspaceId == null || targetId == null) {
            throw new IllegalArgumentException("Workspace and target are required");
        }
        if (targetPath == null || targetPath.isBlank()) {
            throw new IllegalArgumentException("Target path is required");
        }
        createdAt = createdAt == null ? Instant.now() : createdAt;
        expiresAt = expiresAt == null ? createdAt.plus(Duration.ofHours(24)) : expiresAt;
    }

    public boolean isExpired(Instant now) {
        return now.isAfter(expiresAt);
    }

    public boolean isConsumed() {
        return consumedAt != null;
    }

    public DeepLinkToken consume(Instant now) {
        return new DeepLinkToken(id, token, workspaceId, targetType, targetId, targetPath, createdBy, expiresAt, now, createdAt);
    }

    public static Instant defaultExpiry(Instant now, Duration ttl) {
        Duration effective = ttl == null || ttl.isNegative() || ttl.isZero() ? Duration.ofHours(24) : ttl;
        return now.plus(effective);
    }
}
