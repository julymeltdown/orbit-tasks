package com.orbit.identity.domain;

import java.util.UUID;

public record WorkspaceClaim(
        UUID workspaceId,
        String workspaceName,
        String role,
        boolean defaultWorkspace
) {
}
