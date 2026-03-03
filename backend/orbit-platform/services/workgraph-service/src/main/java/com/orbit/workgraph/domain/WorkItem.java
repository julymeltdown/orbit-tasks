package com.orbit.workgraph.domain;

import java.time.Instant;
import java.util.UUID;

public record WorkItem(
        UUID id,
        UUID projectId,
        String type,
        String title,
        String status,
        String assignee,
        Instant startAt,
        Instant dueAt,
        String priority
) {
    public WorkItem transitionTo(String nextStatus) {
        return new WorkItem(id, projectId, type, title, nextStatus, assignee, startAt, dueAt, priority);
    }
}
