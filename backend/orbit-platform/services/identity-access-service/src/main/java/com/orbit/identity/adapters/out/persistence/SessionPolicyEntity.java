package com.orbit.identity.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "identity_session_policy")
public class SessionPolicyEntity {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "workspace_name", nullable = false, length = 120)
    private String workspaceName;

    @Column(name = "role", nullable = false, length = 64)
    private String role;

    @Column(name = "is_default_workspace", nullable = false)
    private boolean defaultWorkspace;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SessionPolicyEntity() {
    }

    public SessionPolicyEntity(UUID userId,
                               UUID workspaceId,
                               String workspaceName,
                               String role,
                               boolean defaultWorkspace,
                               boolean enabled,
                               Instant updatedAt) {
        this.userId = userId;
        this.workspaceId = workspaceId;
        this.workspaceName = workspaceName;
        this.role = role;
        this.defaultWorkspace = defaultWorkspace;
        this.enabled = enabled;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getWorkspaceId() {
        return workspaceId;
    }

    public String getWorkspaceName() {
        return workspaceName;
    }

    public String getRole() {
        return role;
    }

    public boolean isDefaultWorkspace() {
        return defaultWorkspace;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
