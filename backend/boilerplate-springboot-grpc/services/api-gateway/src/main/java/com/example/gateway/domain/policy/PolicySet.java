package com.example.gateway.domain.policy;

public record PolicySet(
        String id,
        String name,
        RateLimitPolicy rateLimit,
        ResiliencePolicy resilience,
        RolloutPolicy rollout,
        String cachePolicy
) {
}
