package com.example.gateway.application.port.out;

import com.example.gateway.domain.activation.ActivationEventRecord;

public interface ActivationEventSink {
    void record(ActivationEventRecord event);
}

