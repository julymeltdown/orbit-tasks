package com.orbit.team.adapters.out.persistence;

import java.time.Instant;
import java.util.UUID;

public record TeamMembershipEntity(
        UUID id,
        UUID teamId,
        String userId,
        String role,
        String invitedBy,
        Instant createdAt
) {
}
