package com.orbit.eventkit.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public interface AuditEvent {
    String action();

    String resourceType();

    UUID resourceId();

    UUID workspaceId();

    UUID actorId();

    Instant occurredAt();

    Map<String, String> attributes();
}
