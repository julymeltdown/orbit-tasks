package com.orbit.agile.domain;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DSUEntry(
        UUID id,
        UUID workspaceId,
        UUID sprintId,
        String authorId,
        String rawText,
        Map<String, Object> extractedJson,
        List<Blocker> blockers,
        Instant createdAt
) {
    public DSUEntry {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace is required");
        }
        if (authorId == null || authorId.isBlank()) {
            throw new IllegalArgumentException("Author is required");
        }
        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException("DSU raw text is required");
        }
        extractedJson = extractedJson == null ? Map.of() : Map.copyOf(extractedJson);
        blockers = blockers == null ? List.of() : List.copyOf(blockers);
        createdAt = createdAt == null ? Instant.now() : createdAt;
    }

    public int blockerCount() {
        return blockers.size();
    }

    public record Blocker(String summary, String ownerTeam, String urgency) {
        public Blocker {
            if (summary == null || summary.isBlank()) {
                throw new IllegalArgumentException("Blocker summary is required");
            }
            ownerTeam = ownerTeam == null || ownerTeam.isBlank() ? "unknown" : ownerTeam;
            urgency = urgency == null || urgency.isBlank() ? "medium" : urgency.toLowerCase();
        }
    }
}
