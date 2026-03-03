package com.example.auth.application.port.out;

import java.time.Instant;
import java.util.UUID;

public record RefreshTokenRecord(String jti, String tokenHash, UUID userId, Instant expiresAt) {
}
