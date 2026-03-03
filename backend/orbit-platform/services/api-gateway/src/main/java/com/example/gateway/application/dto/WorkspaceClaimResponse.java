package com.example.gateway.application.dto;

import java.util.UUID;

public record WorkspaceClaimResponse(
        UUID workspaceId,
        String workspaceName,
        String role,
        boolean defaultWorkspace
) {
}
