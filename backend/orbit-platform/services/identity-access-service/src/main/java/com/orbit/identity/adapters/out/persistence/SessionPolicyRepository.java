package com.orbit.identity.adapters.out.persistence;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Repository;

@Repository
public class SessionPolicyRepository {
    private final Clock clock;
    private final List<SessionPolicyEntity> store = new CopyOnWriteArrayList<>();

    public SessionPolicyRepository(Clock clock) {
        this.clock = clock;
    }

    public List<SessionPolicyEntity> findAllByUserIdAndEnabledTrueOrderByDefaultWorkspaceDescUpdatedAtDesc(UUID userId) {
        return store.stream()
                .filter(policy -> policy.getUserId().equals(userId) && policy.isEnabled())
                .sorted((a, b) -> {
                    if (a.isDefaultWorkspace() == b.isDefaultWorkspace()) {
                        return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                    }
                    return a.isDefaultWorkspace() ? -1 : 1;
                })
                .toList();
    }

    public void save(SessionPolicyEntity entity) {
        store.add(entity);
    }

    public void seed(UUID userId, UUID workspaceId, String workspaceName, String role, boolean defaultWorkspace) {
        store.add(new SessionPolicyEntity(
                userId,
                workspaceId,
                workspaceName,
                role,
                defaultWorkspace,
                true,
                Instant.now(clock)));
    }
}
