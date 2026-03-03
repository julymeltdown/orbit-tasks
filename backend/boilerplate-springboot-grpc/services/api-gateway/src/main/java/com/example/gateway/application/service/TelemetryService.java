package com.example.gateway.application.service;

import com.example.gateway.application.dto.telemetry.TelemetrySummary;
import com.example.gateway.application.port.out.TelemetrySink;
import com.example.gateway.domain.telemetry.TelemetryRecord;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TelemetryService {
    private final TelemetrySink telemetrySink;

    public TelemetryService(TelemetrySink telemetrySink) {
        this.telemetrySink = telemetrySink;
    }

    public void recordRequest(
            String correlationId,
            String routeKey,
            String clientProfileId,
            String outcome,
            long latencyMs,
            String errorCode,
            Map<String, Long> downstreamLatencies) {
        TelemetryRecord record = new TelemetryRecord(
                UUID.randomUUID().toString(),
                correlationId,
                routeKey,
                clientProfileId,
                outcome,
                latencyMs,
                downstreamLatencies,
                errorCode,
                Instant.now());
        telemetrySink.record(record);
    }

    public void recordDownstreamLatency(String target, long latencyMs, boolean success) {
        telemetrySink.recordDownstream(target, latencyMs, success);
    }

    public TelemetrySummary summary() {
        return telemetrySink.summary();
    }
}
