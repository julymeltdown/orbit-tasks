package com.example.post.events;

import com.example.post.application.event.StoredEvent;
import com.example.post.application.port.out.EventStorePort;
import com.example.post.domain.event.PostCreatedEvent;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = {"post.internal-events", "post.external-events"})
@TestPropertySource(properties = {
        "post.kafka.enabled=true",
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "post.events.internal-topic=post.internal-events",
        "post.events.external-topic=post.external-events",
        "post.events.publish-record-group-id=post-publish-record-test",
        "post.events.external-group-id=post-external-test",
        "post.events.notification-group-id=post-notification-test"
})
class InternalEventPublishRecordTest {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private EventStorePort eventStore;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void marksEventAsPublishedAfterInternalEvent() {
        UUID eventId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-24T01:10:00Z");
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

        Awaitility.await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            StoredEvent stored = eventStore.findById(eventId).orElseThrow();
            assertTrue(stored.published());
            assertNotNull(stored.publishedAt());
        });
    }
}
