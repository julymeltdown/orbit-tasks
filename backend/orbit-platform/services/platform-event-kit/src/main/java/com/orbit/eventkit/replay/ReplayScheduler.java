package com.orbit.eventkit.replay;

import java.time.Duration;

public interface ReplayScheduler {
    int replayUnpublished(Duration olderThan, int maxItems);

    int replayDeadLetter(Duration olderThan, int maxItems);
}
