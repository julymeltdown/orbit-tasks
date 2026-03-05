package com.example.gateway.adapters.out.telemetry;

import com.example.gateway.application.port.out.ActivationEventSink;
import com.example.gateway.domain.activation.ActivationEventRecord;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

@Component
public class InMemoryActivationEventSink implements ActivationEventSink {
    private final List<ActivationEventRecord> events = new CopyOnWriteArrayList<>();

    @Override
    public void record(ActivationEventRecord event) {
        events.add(event);
    }

    public List<ActivationEventRecord> snapshot() {
        return List.copyOf(events);
    }
}

