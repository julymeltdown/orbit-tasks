package com.example.post.events;

import com.example.post.application.event.StoredEvent;
import com.example.post.application.port.out.EventStorePort;
import com.example.post.domain.event.PostCreatedEvent;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "post.kafka.enabled=false")
class EventOutboxPersistenceTest {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private EventStorePort eventStore;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void storesDomainEventInsideTransaction() {
        UUID eventId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-24T01:00:00Z");
        PostCreatedEvent event = new PostCreatedEvent(
                eventId,
                postId,
                authorId,
                "hello",
                "PUBLIC",
                now,
                now
        );

        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> eventPublisher.publishEvent(event));

        StoredEvent stored = eventStore.findById(eventId).orElseThrow();
        assertEquals(event.eventType(), stored.eventType());
        assertEquals(postId, stored.aggregateId());
        assertEquals(authorId, stored.actorId());
        assertFalse(stored.published());
        assertTrue(stored.attributes().contains("content"));
    }
}
