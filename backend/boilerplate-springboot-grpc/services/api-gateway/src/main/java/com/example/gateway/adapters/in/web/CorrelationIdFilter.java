package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.TelemetryService;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    private final TelemetryService telemetryService;

    public CorrelationIdFilter(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String correlationId = Optional.ofNullable(request.getHeader("X-Correlation-Id"))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
        MDC.put("traceId", correlationId);
        response.setHeader("X-Correlation-Id", correlationId);
        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            String outcome = response.getStatus() >= 500 ? "ERROR" : "SUCCESS";
            String errorCode = response.getStatus() >= 500
                    ? "GATEWAY_" + HttpStatus.valueOf(response.getStatus()).name()
                    : null;
            String clientProfileId = request.getHeader("X-Client-Id");
            telemetryService.recordRequest(
                    correlationId,
                    request.getRequestURI(),
                    clientProfileId,
                    outcome,
                    latencyMs,
                    errorCode,
                    Map.of());
            MDC.remove("traceId");
        }
    }
}
