package com.example.gateway.domain.telemetry;

import java.time.Instant;
import java.util.Map;

public record TelemetryRecord(
        String id,
        String correlationId,
        String routeContractVersion,
        String clientProfileId,
        String outcome,
        long latencyMs,
        Map<String, Long> downstreamLatencies,
        String errorCode,
        Instant timestamp
) {
}
