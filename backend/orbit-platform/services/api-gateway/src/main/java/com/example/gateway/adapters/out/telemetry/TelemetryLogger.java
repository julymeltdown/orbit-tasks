package com.example.gateway.adapters.out.telemetry;

import com.example.gateway.application.dto.telemetry.TelemetrySummary;
import com.example.gateway.application.port.out.TelemetrySink;
import com.example.gateway.domain.telemetry.TelemetryRecord;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

@Component
public class TelemetryLogger implements TelemetrySink {
    private final List<TelemetryRecord> records = new CopyOnWriteArrayList<>();
    private final AtomicLong downstreamCalls = new AtomicLong();

    @Override
    public void record(TelemetryRecord record) {
        records.add(record);
    }

    @Override
    public void recordDownstream(String target, long latencyMs, boolean success) {
        downstreamCalls.incrementAndGet();
    }

    @Override
    public TelemetrySummary summary() {
        long total = records.size();
        if (total == 0) {
            return new TelemetrySummary(0, 0.0, 0);
        }
        long errors = records.stream()
                .filter(record -> !"SUCCESS".equalsIgnoreCase(record.outcome()))
                .count();
        List<Long> latencies = new ArrayList<>(records.size());
        for (TelemetryRecord record : records) {
            latencies.add(record.latencyMs());
        }
        latencies.sort(Comparator.naturalOrder());
        int index = (int) Math.ceil(0.95 * latencies.size()) - 1;
        long p95 = latencies.get(Math.max(0, index));
        double errorRate = (double) errors / total;
        return new TelemetrySummary(total, errorRate, p95);
    }
}
