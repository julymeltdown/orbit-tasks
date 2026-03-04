package com.orbit.identity.application.service;

import com.orbit.identity.adapters.out.persistence.SessionPolicyRepository;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceProvisioningService {
    private static final String DEFAULT_WORKSPACE_NAME = "Default Workspace";
    private static final String DEFAULT_ROLE = "WORKSPACE_MEMBER";

    private final SessionPolicyRepository sessionPolicyRepository;

    public WorkspaceProvisioningService(SessionPolicyRepository sessionPolicyRepository) {
        this.sessionPolicyRepository = sessionPolicyRepository;
    }

    public UUID ensureDefaultWorkspace(UUID userId) {
        return ensureDefaultWorkspace(userId, DEFAULT_WORKSPACE_NAME);
    }

    public UUID ensureDefaultWorkspace(UUID userId, String workspaceName) {
        UUID workspaceId = UUID.nameUUIDFromBytes(("workspace:" + userId).getBytes(StandardCharsets.UTF_8));
        String normalizedName = normalizeWorkspaceName(workspaceName);
        sessionPolicyRepository.ensureDefaultWorkspace(
                userId,
                workspaceId,
                normalizedName,
                DEFAULT_ROLE);
        return workspaceId;
    }

    private String normalizeWorkspaceName(String workspaceName) {
        String normalized = workspaceName == null ? "" : workspaceName.trim();
        if (normalized.isEmpty()) {
            return DEFAULT_WORKSPACE_NAME;
        }
        return normalized;
    }
}
