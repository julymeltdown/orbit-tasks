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
        UUID workspaceId = UUID.nameUUIDFromBytes(("workspace:" + userId).getBytes(StandardCharsets.UTF_8));
        sessionPolicyRepository.ensureDefaultWorkspace(
                userId,
                workspaceId,
                DEFAULT_WORKSPACE_NAME,
                DEFAULT_ROLE);
        return workspaceId;
    }
}
