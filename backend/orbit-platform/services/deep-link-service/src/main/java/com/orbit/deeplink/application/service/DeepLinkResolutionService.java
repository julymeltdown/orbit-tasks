package com.orbit.deeplink.application.service;

import com.orbit.deeplink.domain.DeepLinkToken;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class DeepLinkResolutionService {
    private final Map<String, DeepLinkToken> tokens = new ConcurrentHashMap<>();

    public DeepLinkToken issue(UUID workspaceId, String targetType, UUID targetId, String targetPath, String actorId) {
        Instant now = Instant.now();
        String value = UUID.randomUUID().toString().replace("-", "");
        DeepLinkToken token = new DeepLinkToken(
                UUID.randomUUID(),
                value,
                workspaceId,
                targetType,
                targetId,
                targetPath,
                actorId,
                DeepLinkToken.defaultExpiry(now, Duration.ofHours(6)),
                null,
                now);
        tokens.put(token.token(), token);
        return token;
    }

    public Resolution resolve(String token, String actorId, boolean authenticated) {
        DeepLinkToken found = tokens.get(token);
        if (found == null) {
            return new Resolution("NOT_FOUND", "/inbox", "invalid_token");
        }
        if (found.isExpired(Instant.now())) {
            return new Resolution("EXPIRED", "/inbox", "expired");
        }
        if (!authenticated || actorId == null || actorId.isBlank()) {
            return new Resolution("AUTH_REQUIRED", "/login?returnTo=/dl/" + token, "login_required");
        }
        if (found.isConsumed()) {
            return new Resolution("ALREADY_USED", found.targetPath(), "already_consumed");
        }

        tokens.put(token, found.consume(Instant.now()));
        return new Resolution("OK", found.targetPath(), "resolved");
    }

    public record Resolution(String status, String targetPath, String reason) {
    }
}
