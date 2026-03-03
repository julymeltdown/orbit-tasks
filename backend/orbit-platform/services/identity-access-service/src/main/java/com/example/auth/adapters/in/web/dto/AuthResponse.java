package com.example.auth.adapters.in.web.dto;

import com.example.auth.domain.IdentityProvider;
import java.util.List;
import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        List<IdentityProvider> linkedProviders) {
}
