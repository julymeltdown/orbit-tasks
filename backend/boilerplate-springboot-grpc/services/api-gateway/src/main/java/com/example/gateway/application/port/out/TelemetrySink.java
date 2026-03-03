package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.telemetry.TelemetrySummary;
import com.example.gateway.domain.telemetry.TelemetryRecord;

public interface TelemetrySink {
    void record(TelemetryRecord record);

    void recordDownstream(String target, long latencyMs, boolean success);

    TelemetrySummary summary();
}
