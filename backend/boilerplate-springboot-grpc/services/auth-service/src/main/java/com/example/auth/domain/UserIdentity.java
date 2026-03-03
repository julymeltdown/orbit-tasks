package com.example.auth.domain;

import java.time.Instant;
import java.util.UUID;

public class UserIdentity {
    private final UUID id;
    private final UUID userId;
    private final IdentityProvider providerType;
    private final String providerSubject;
    private final String email;
    private final boolean emailVerified;
    private final Instant linkedAt;

    public UserIdentity(UUID id, UUID userId, IdentityProvider providerType, String providerSubject,
                        String email, boolean emailVerified, Instant linkedAt) {
        this.id = id;
        this.userId = userId;
        this.providerType = providerType;
        this.providerSubject = providerSubject;
        this.email = email;
        this.emailVerified = emailVerified;
        this.linkedAt = linkedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public IdentityProvider getProviderType() {
        return providerType;
    }

    public String getProviderSubject() {
        return providerSubject;
    }

    public String getEmail() {
        return email;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }
}
