package com.orbit.collaboration.domain;

import java.time.Instant;
import java.util.UUID;

public record Thread(
        UUID id,
        UUID workspaceId,
        UUID workItemId,
        String title,
        Status status,
        String createdBy,
        Instant createdAt,
        Instant resolvedAt
) {
    public Thread {
        if (workspaceId == null || workItemId == null) {
            throw new IllegalArgumentException("Thread requires workspace and work item");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Thread title is required");
        }
        if (createdBy == null || createdBy.isBlank()) {
            throw new IllegalArgumentException("Thread creator is required");
        }
        createdAt = createdAt == null ? Instant.now() : createdAt;
    }

    public Thread resolve() {
        return new Thread(id, workspaceId, workItemId, title, Status.RESOLVED, createdBy, createdAt, Instant.now());
    }

    public Thread reopen() {
        return new Thread(id, workspaceId, workItemId, title, Status.OPEN, createdBy, createdAt, null);
    }

    public enum Status {
        OPEN,
        RESOLVED,
        ARCHIVED
    }
}
