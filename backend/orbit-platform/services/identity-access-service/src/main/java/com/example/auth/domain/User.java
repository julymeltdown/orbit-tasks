package com.example.auth.domain;

import java.time.Instant;
import java.util.UUID;

public class User {
    private final UUID id;
    private final String primaryEmail;
    private final String passwordHash;
    private final UserStatus status;
    private final Instant lastLoginAt;

    public User(UUID id, String primaryEmail, String passwordHash, UserStatus status, Instant lastLoginAt) {
        this.id = id;
        this.primaryEmail = primaryEmail;
        this.passwordHash = passwordHash;
        this.status = status;
        this.lastLoginAt = lastLoginAt;
    }

    public UUID getId() {
        return id;
    }

    public String getPrimaryEmail() {
        return primaryEmail;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserStatus getStatus() {
        return status;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }
}
