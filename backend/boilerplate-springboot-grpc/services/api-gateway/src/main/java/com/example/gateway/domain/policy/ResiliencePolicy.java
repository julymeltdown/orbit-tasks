package com.example.gateway.domain.policy;

public record ResiliencePolicy(Integer timeoutMs, Integer retryMax, Boolean circuitBreakerEnabled) {
}
