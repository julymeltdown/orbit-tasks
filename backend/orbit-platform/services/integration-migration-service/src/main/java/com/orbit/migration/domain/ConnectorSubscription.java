package com.orbit.migration.domain;

import java.time.Instant;
import java.util.UUID;

public record ConnectorSubscription(
        UUID id,
        UUID workspaceId,
        String provider,
        String scope,
        String authType,
        Status status,
        Instant createdAt,
        Instant updatedAt
) {
    public ConnectorSubscription {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace is required");
        }
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("Provider is required");
        }
        if (scope == null || scope.isBlank()) {
            throw new IllegalArgumentException("Scope is required");
        }
        createdAt = createdAt == null ? Instant.now() : createdAt;
        updatedAt = updatedAt == null ? createdAt : updatedAt;
    }

    public ConnectorSubscription activate() {
        return new ConnectorSubscription(id, workspaceId, provider, scope, authType, Status.ACTIVE, createdAt, Instant.now());
    }

    public ConnectorSubscription disable() {
        return new ConnectorSubscription(id, workspaceId, provider, scope, authType, Status.DISABLED, createdAt, Instant.now());
    }

    public enum Status {
        PENDING,
        ACTIVE,
        DISABLED,
        ERROR
    }
}
