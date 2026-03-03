package com.example.auth.application.service;

import com.example.auth.application.security.JwtTokenService;
import java.util.UUID;

public record AuthSession(UUID userId, JwtTokenService.TokenPair tokens) {
}
