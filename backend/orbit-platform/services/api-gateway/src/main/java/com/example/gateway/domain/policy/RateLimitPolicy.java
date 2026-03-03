package com.example.gateway.domain.policy;

public record RateLimitPolicy(Integer requestsPerMinute, Integer burst) {
}
