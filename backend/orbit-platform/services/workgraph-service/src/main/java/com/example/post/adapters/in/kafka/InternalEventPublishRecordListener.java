package com.example.post.adapters.in.kafka;

import com.example.post.application.event.EventMessageMapper;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.port.out.EventStorePort;
import java.time.Clock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "post.kafka.enabled", havingValue = "true")
public class InternalEventPublishRecordListener {
    private final EventStorePort eventStore;
    private final EventMessageMapper mapper;
    private final Clock clock;

    public InternalEventPublishRecordListener(EventStorePort eventStore,
                                              EventMessageMapper mapper,
                                              Clock clock) {
        this.eventStore = eventStore;
        this.mapper = mapper;
        this.clock = clock;
    }

    @KafkaListener(
            topics = "${post.events.internal-topic:post.internal-events}",
            groupId = "${post.events.publish-record-group-id:post-event-publish-record}"
    )
    public void record(String message) {
        InternalEventMessage internal = mapper.readInternal(message);
        eventStore.markPublished(internal.eventId(), clock.instant());
    }
}
