package com.example.post.application.event;

import com.example.post.application.port.out.EventPublisherPort;
import com.example.post.application.port.out.EventStorePort;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EventReplayService {
    private final EventStorePort eventStore;
    private final EventPublisherPort publisher;
    private final EventMessageMapper mapper;
    private final Clock clock;

    public EventReplayService(EventStorePort eventStore,
                              EventPublisherPort publisher,
                              EventMessageMapper mapper,
                              Clock clock) {
        this.eventStore = eventStore;
        this.publisher = publisher;
        this.mapper = mapper;
        this.clock = clock;
    }

    public int replay(EventReplayFilter filter, ReplayTarget target, int limit) {
        List<StoredEvent> events = eventStore.findEvents(filter, limit);
        for (StoredEvent event : events) {
            InternalEventMessage internal = mapper.toInternal(event);
            publish(target, internal);
        }
        return events.size();
    }

    public int republishUnpublished(Duration delay, int limit) {
        Instant threshold = clock.instant().minus(delay);
        List<StoredEvent> events = eventStore.findUnpublished(threshold, limit);
        for (StoredEvent event : events) {
            InternalEventMessage internal = mapper.toInternal(event);
            publish(ReplayTarget.INTERNAL, internal);
        }
        return events.size();
    }

    private void publish(ReplayTarget target, InternalEventMessage internal) {
        if (target == null || target == ReplayTarget.INTERNAL) {
            publisher.publishInternal(internal);
            return;
        }
        if (target == ReplayTarget.EXTERNAL) {
            publisher.publishExternal(mapper.toExternal(internal));
            return;
        }
        if (target == ReplayTarget.BOTH) {
            publisher.publishInternal(internal);
            publisher.publishExternal(mapper.toExternal(internal));
        }
    }
}
