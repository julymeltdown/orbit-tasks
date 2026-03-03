package com.example.post.application.event;

import com.example.post.application.port.out.EventStorePort;
import com.example.post.domain.event.DomainEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class DomainEventOutboxListener {
    private final EventStorePort eventStore;

    public DomainEventOutboxListener(EventStorePort eventStore) {
        this.eventStore = eventStore;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void store(DomainEvent event) {
        eventStore.save(event);
    }
}
