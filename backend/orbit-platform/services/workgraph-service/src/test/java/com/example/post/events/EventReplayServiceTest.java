package com.example.post.events;

import com.example.post.application.event.EventReplayFilter;
import com.example.post.application.event.EventReplayService;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.event.ExternalEventMessage;
import com.example.post.application.event.ReplayTarget;
import com.example.post.application.port.out.EventPublisherPort;
import com.example.post.domain.event.PostCreatedEvent;
import com.example.post.domain.event.PostEventType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "post.kafka.enabled=false")
class EventReplayServiceTest {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EventReplayService replayService;

    @Autowired
    private RecordingEventPublisher recordingPublisher;

    @Test
    void replaysFilteredEvents() {
        UUID actorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        Instant now = Instant.parse("2026-01-24T02:00:00Z");

        PostCreatedEvent event = new PostCreatedEvent(
                UUID.randomUUID(),
                postId,
                actorId,
                "hello",
                "PUBLIC",
                now,
                now
        );

        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.executeWithoutResult(status -> eventPublisher.publishEvent(event));

        EventReplayFilter filter = new EventReplayFilter(actorId, PostEventType.POST_CREATED.name(), "content", null, null, null);
        int count = replayService.replay(filter, ReplayTarget.INTERNAL, 10);

        assertEquals(1, count);
        assertEquals(2, recordingPublisher.internalMessages.size());
    }

    @TestConfiguration
    static class RecordingConfig {
        @Bean
        @Primary
        RecordingEventPublisher recordingEventPublisher() {
            return new RecordingEventPublisher();
        }
    }

    static class RecordingEventPublisher implements EventPublisherPort {
        private final List<InternalEventMessage> internalMessages = new ArrayList<>();
        private final List<ExternalEventMessage> externalMessages = new ArrayList<>();

        @Override
        public void publishInternal(InternalEventMessage message) {
            internalMessages.add(message);
        }

        @Override
        public void publishExternal(ExternalEventMessage message) {
            externalMessages.add(message);
        }
    }
}
