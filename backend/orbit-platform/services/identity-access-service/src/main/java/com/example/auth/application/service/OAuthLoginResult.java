package com.example.auth.application.service;

import com.example.auth.application.security.JwtTokenService;
import com.example.auth.domain.IdentityProvider;
import java.util.List;
import java.util.UUID;

public record OAuthLoginResult(
        UUID userId,
        JwtTokenService.TokenPair tokens,
        List<IdentityProvider> linkedProviders) {
}
