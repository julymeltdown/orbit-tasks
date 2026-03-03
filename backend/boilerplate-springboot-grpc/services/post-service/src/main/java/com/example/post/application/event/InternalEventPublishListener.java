package com.example.post.application.event;

import com.example.post.application.port.out.EventPublisherPort;
import com.example.post.domain.event.DomainEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class InternalEventPublishListener {
    private final EventPublisherPort publisher;
    private final EventMessageMapper mapper;

    public InternalEventPublishListener(EventPublisherPort publisher, EventMessageMapper mapper) {
        this.publisher = publisher;
        this.mapper = mapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(DomainEvent event) {
        publisher.publishInternal(mapper.toInternal(event));
    }
}
