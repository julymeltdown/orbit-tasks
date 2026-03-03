package com.example.post.adapters.out.kafka;

import com.example.post.application.event.EventMessageMapper;
import com.example.post.application.event.ExternalEventMessage;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.port.out.EventPublisherPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "post.kafka.enabled", havingValue = "true")
public class KafkaEventPublisher implements EventPublisherPort {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final EventMessageMapper mapper;
    private final String internalTopic;
    private final String externalTopic;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate,
                               EventMessageMapper mapper,
                               @Value("${post.events.internal-topic:post.internal-events}") String internalTopic,
                               @Value("${post.events.external-topic:post.external-events}") String externalTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.mapper = mapper;
        this.internalTopic = internalTopic;
        this.externalTopic = externalTopic;
    }

    @Override
    public void publishInternal(InternalEventMessage message) {
        if (message == null) {
            return;
        }
        kafkaTemplate.send(internalTopic, mapper.normalizeKey(message.aggregateId()), mapper.writeJson(message));
    }

    @Override
    public void publishExternal(ExternalEventMessage message) {
        if (message == null) {
            return;
        }
        kafkaTemplate.send(externalTopic, mapper.normalizeKey(message.aggregateId()), mapper.writeJson(message));
    }
}
