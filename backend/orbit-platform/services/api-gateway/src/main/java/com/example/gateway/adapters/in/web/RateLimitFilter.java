package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.PolicyService;
import com.example.gateway.domain.policy.PolicySet;
import com.example.gateway.domain.policy.RateLimitPolicy;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private final PolicyService policyService;
    private final ConcurrentHashMap<String, RateWindow> counters = new ConcurrentHashMap<>();

    public RateLimitFilter(PolicyService policyService) {
        this.policyService = policyService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        RateLimitPolicy policy = resolvePolicy();
        if (policy == null || policy.requestsPerMinute() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientId = Optional.ofNullable(request.getHeader("X-Client-Id")).orElse("default");
        RateWindow window = counters.computeIfAbsent(clientId, key -> new RateWindow());
        if (!window.tryAcquire(policy.requestsPerMinute())) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(errorJson());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitPolicy resolvePolicy() {
        PolicySet policySet = policyService.defaultPolicy();
        return policySet != null ? policySet.rateLimit() : null;
    }

    private String errorJson() {
        String traceId = UUID.randomUUID().toString();
        return "{\"code\":\"GATEWAY_TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded\","
                + "\"traceId\":\"" + traceId + "\",\"timestamp\":\"" + Instant.now() + "\"}";
    }

    private static final class RateWindow {
        private Instant windowStart = Instant.now();
        private final AtomicInteger count = new AtomicInteger();

        boolean tryAcquire(int limit) {
            Instant now = Instant.now();
            if (Duration.between(windowStart, now).compareTo(WINDOW) >= 0) {
                windowStart = now;
                count.set(0);
            }
            return count.incrementAndGet() <= limit;
        }
    }
}
