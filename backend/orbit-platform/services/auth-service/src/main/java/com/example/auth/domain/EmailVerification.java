package com.example.auth.domain;

import java.time.Instant;
import java.util.UUID;

public class EmailVerification {
    private final UUID id;
    private final UUID userId;
    private final String email;
    private final String codeHash;
    private final Instant expiresAt;
    private final int attempts;
    private final int maxAttempts;
    private final EmailVerificationStatus status;

    public EmailVerification(UUID id, UUID userId, String email, String codeHash, Instant expiresAt,
                             int attempts, int maxAttempts, EmailVerificationStatus status) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.attempts = attempts;
        this.maxAttempts = maxAttempts;
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

    public String getCodeHash() {
        return codeHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public EmailVerificationStatus getStatus() {
        return status;
    }
}
