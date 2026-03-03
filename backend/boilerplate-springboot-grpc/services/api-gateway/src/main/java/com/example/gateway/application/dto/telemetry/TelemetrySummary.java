package com.example.gateway.application.dto.telemetry;

public record TelemetrySummary(long totalRequests, double errorRate, long p95LatencyMs) {
}
