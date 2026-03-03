package com.example.post.application.event;

import com.example.post.domain.event.DomainEvent;
import java.util.UUID;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class EventMessageMapper {
    private final ObjectMapper objectMapper;

    public EventMessageMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public InternalEventMessage toInternal(DomainEvent event) {
        return new InternalEventMessage(
                event.eventId(),
                event.eventType(),
                event.aggregateId(),
                event.actorId(),
                event.attributes(),
                event.occurredAt(),
                writeJson(event)
        );
    }

    public InternalEventMessage toInternal(StoredEvent storedEvent) {
        return new InternalEventMessage(
                storedEvent.eventId(),
                storedEvent.eventType(),
                storedEvent.aggregateId(),
                storedEvent.actorId(),
                storedEvent.attributes(),
                storedEvent.occurredAt(),
                storedEvent.payload()
        );
    }

    public ExternalEventMessage toExternal(InternalEventMessage internalEvent) {
        return new ExternalEventMessage(
                internalEvent.eventId(),
                internalEvent.eventType(),
                internalEvent.aggregateId(),
                internalEvent.actorId(),
                internalEvent.attributes(),
                internalEvent.occurredAt()
        );
    }

    public InternalEventMessage readInternal(String json) {
        try {
            return objectMapper.readValue(json, InternalEventMessage.class);
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Invalid internal event", ex);
        }
    }

    public String writeJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Failed to serialize event", ex);
        }
    }

    public String normalizeKey(UUID aggregateId) {
        return aggregateId == null ? null : aggregateId.toString();
    }
}
