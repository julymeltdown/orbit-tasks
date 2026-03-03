package com.orbit.eventkit.audit;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

@Component
public class AuditSinkAdapter {
    private final List<AuditEnvelope> events = new CopyOnWriteArrayList<>();

    public AuditEnvelope append(String workspaceId,
                                String actor,
                                String action,
                                String targetType,
                                String targetId,
                                Map<String, Object> payload) {
        AuditEnvelope envelope = new AuditEnvelope(
                UUID.randomUUID().toString(),
                workspaceId,
                actor,
                action,
                targetType,
                targetId,
                payload == null ? Map.of() : Map.copyOf(payload),
                Instant.now().toString());
        events.add(envelope);
        return envelope;
    }

    public List<AuditEnvelope> findByWorkspace(String workspaceId) {
        List<AuditEnvelope> result = new ArrayList<>();
        for (AuditEnvelope event : events) {
            if (event.workspaceId().equals(workspaceId)) {
                result.add(event);
            }
        }
        return result;
    }

    public record AuditEnvelope(
            String eventId,
            String workspaceId,
            String actor,
            String action,
            String targetType,
            String targetId,
            Map<String, Object> payload,
            String createdAt
    ) {
    }
}
