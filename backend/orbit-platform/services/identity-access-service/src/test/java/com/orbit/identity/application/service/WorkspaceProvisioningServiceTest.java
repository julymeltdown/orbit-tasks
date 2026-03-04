package com.orbit.identity.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.orbit.identity.adapters.out.persistence.SessionPolicyRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class WorkspaceProvisioningServiceTest {

    @Test
    void createsDefaultWorkspaceClaimWhenNoneExists() {
        SessionPolicyRepository repository = new SessionPolicyRepository(
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
        WorkspaceProvisioningService service = new WorkspaceProvisioningService(repository);
        UUID userId = UUID.randomUUID();

        UUID workspaceId = service.ensureDefaultWorkspace(userId);

        var claims = repository.findAllByUserIdAndEnabledTrueOrderByDefaultWorkspaceDescUpdatedAtDesc(userId);
        assertThat(claims).hasSize(1);
        assertThat(claims.get(0).getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(claims.get(0).getWorkspaceName()).isEqualTo("Default Workspace");
        assertThat(claims.get(0).getRole()).isEqualTo("WORKSPACE_MEMBER");
        assertThat(claims.get(0).isDefaultWorkspace()).isTrue();
    }

    @Test
    void isIdempotentWhenCalledMultipleTimesForSameUser() {
        SessionPolicyRepository repository = new SessionPolicyRepository(
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
        WorkspaceProvisioningService service = new WorkspaceProvisioningService(repository);
        UUID userId = UUID.randomUUID();

        UUID firstWorkspace = service.ensureDefaultWorkspace(userId);
        UUID secondWorkspace = service.ensureDefaultWorkspace(userId);

        var claims = repository.findAllByUserIdAndEnabledTrueOrderByDefaultWorkspaceDescUpdatedAtDesc(userId);
        assertThat(claims).hasSize(1);
        assertThat(secondWorkspace).isEqualTo(firstWorkspace);
    }
}
