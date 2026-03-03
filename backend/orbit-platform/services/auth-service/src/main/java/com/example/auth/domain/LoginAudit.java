package com.example.auth.domain;

import java.time.Instant;
import java.util.UUID;

public class LoginAudit {
    private final UUID id;
    private final UUID userId;
    private final LoginMethod loginMethod;
    private final String ipAddress;
    private final String userAgent;
    private final boolean success;
    private final Instant occurredAt;

    public LoginAudit(UUID id, UUID userId, LoginMethod loginMethod, String ipAddress,
                      String userAgent, boolean success, Instant occurredAt) {
        this.id = id;
        this.userId = userId;
        this.loginMethod = loginMethod;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.success = success;
        this.occurredAt = occurredAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public LoginMethod getLoginMethod() {
        return loginMethod;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public boolean isSuccess() {
        return success;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
