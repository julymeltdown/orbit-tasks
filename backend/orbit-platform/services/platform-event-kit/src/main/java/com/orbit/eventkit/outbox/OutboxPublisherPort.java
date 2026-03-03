package com.orbit.eventkit.outbox;

import java.time.Duration;
import java.util.List;

public interface OutboxPublisherPort {
    int publishBatch(int maxItems);

    int replayFailed(Duration olderThan, int maxItems);

    List<String> supportedTopics();
}
