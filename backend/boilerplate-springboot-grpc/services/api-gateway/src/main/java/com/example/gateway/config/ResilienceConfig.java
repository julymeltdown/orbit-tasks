package com.example.gateway.config;

import com.example.gateway.domain.policy.ResiliencePolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ResilienceConfig {

    @Bean
    ResiliencePolicy defaultResiliencePolicy(
            @Value("${gateway.resilience.timeout-ms:1000}") int timeoutMs,
            @Value("${gateway.resilience.retry-max:2}") int retryMax,
            @Value("${gateway.resilience.circuit-breaker-enabled:true}") boolean circuitBreakerEnabled) {
        return new ResiliencePolicy(timeoutMs, retryMax, circuitBreakerEnabled);
    }
}
