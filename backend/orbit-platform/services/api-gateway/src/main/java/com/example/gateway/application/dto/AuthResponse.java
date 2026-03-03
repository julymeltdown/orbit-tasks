package com.example.gateway.application.dto;

import com.example.gateway.domain.IdentityProvider;
import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.List;
import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String accessToken,
        String refreshToken,
        String tokenType,
        @JsonAlias("expiresInSeconds") long expiresIn,
        List<IdentityProvider> linkedProviders) {
}
