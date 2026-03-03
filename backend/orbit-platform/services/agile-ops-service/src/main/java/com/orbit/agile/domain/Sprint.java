package com.orbit.agile.domain;

import java.time.LocalDate;
import java.util.UUID;

public record Sprint(
        UUID id,
        UUID workspaceId,
        UUID projectId,
        String name,
        String goal,
        LocalDate startDate,
        LocalDate endDate,
        int capacityStoryPoints,
        Status status
) {
    public Sprint {
        if (workspaceId == null || projectId == null) {
            throw new IllegalArgumentException("Workspace and project are required");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Sprint name is required");
        }
        if (goal == null || goal.isBlank()) {
            throw new IllegalArgumentException("Sprint goal is required");
        }
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Sprint date range is invalid");
        }
        if (capacityStoryPoints < 0) {
            throw new IllegalArgumentException("Capacity cannot be negative");
        }
    }

    public Sprint activate() {
        return new Sprint(id, workspaceId, projectId, name, goal, startDate, endDate, capacityStoryPoints, Status.ACTIVE);
    }

    public Sprint close() {
        return new Sprint(id, workspaceId, projectId, name, goal, startDate, endDate, capacityStoryPoints, Status.CLOSED);
    }

    public enum Status {
        PLANNED,
        ACTIVE,
        CLOSED
    }
}
