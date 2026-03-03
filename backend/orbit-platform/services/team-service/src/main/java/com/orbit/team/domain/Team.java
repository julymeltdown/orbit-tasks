package com.orbit.team.domain;

import java.time.Instant;
import java.util.UUID;

public record Team(
        UUID id,
        UUID workspaceId,
        String name,
        String createdBy,
        Instant createdAt
) {
}
