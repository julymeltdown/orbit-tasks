package com.example.post.application.event;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "post.events.republish.enabled", havingValue = "true")
public class EventRepublishScheduler {
    private static final Logger log = LoggerFactory.getLogger(EventRepublishScheduler.class);
    private final EventReplayService replayService;
    private final Duration delay;
    private final int limit;

    public EventRepublishScheduler(EventReplayService replayService,
                                   @Value("${post.events.republish.delay:PT5M}") Duration delay,
                                   @Value("${post.events.republish.limit:200}") int limit) {
        this.replayService = replayService;
        this.delay = delay;
        this.limit = limit;
    }

    @Scheduled(fixedDelayString = "${post.events.republish.interval:PT5M}")
    public void republish() {
        int count = replayService.republishUnpublished(delay, limit);
        log.info("Event republish scan complete (delay={}, limit={}, republished={})", delay, limit, count);
    }
}
