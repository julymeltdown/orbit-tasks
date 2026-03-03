package com.example.auth.domain;

import java.time.Instant;
import java.util.UUID;

public class PasswordResetToken {
    private final UUID id;
    private final UUID userId;
    private final String email;
    private final String tokenHash;
    private final Instant expiresAt;
    private final PasswordResetStatus status;

    public PasswordResetToken(UUID id,
                              UUID userId,
                              String email,
                              String tokenHash,
                              Instant expiresAt,
                              PasswordResetStatus status) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public PasswordResetStatus getStatus() {
        return status;
    }
}
