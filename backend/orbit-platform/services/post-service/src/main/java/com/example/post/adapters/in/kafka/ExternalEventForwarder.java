package com.example.post.adapters.in.kafka;

import com.example.post.application.event.EventMessageMapper;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.port.out.EventPublisherPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "post.kafka.enabled", havingValue = "true")
public class ExternalEventForwarder {
    private final EventPublisherPort publisher;
    private final EventMessageMapper mapper;

    public ExternalEventForwarder(EventPublisherPort publisher, EventMessageMapper mapper) {
        this.publisher = publisher;
        this.mapper = mapper;
    }

    @KafkaListener(
            topics = "${post.events.internal-topic:post.internal-events}",
            groupId = "${post.events.external-group-id:post-event-external}"
    )
    public void forward(String message) {
        InternalEventMessage internal = mapper.readInternal(message);
        publisher.publishExternal(mapper.toExternal(internal));
    }
}
