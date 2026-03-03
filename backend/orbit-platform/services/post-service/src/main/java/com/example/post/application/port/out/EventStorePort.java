package com.example.post.application.port.out;

import com.example.post.application.event.EventReplayFilter;
import com.example.post.application.event.StoredEvent;
import com.example.post.domain.event.DomainEvent;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventStorePort {
    StoredEvent save(DomainEvent event);

    Optional<StoredEvent> findById(UUID eventId);

    void markPublished(UUID eventId, Instant publishedAt);

    List<StoredEvent> findUnpublished(Instant olderThan, int limit);

    List<StoredEvent> findEvents(EventReplayFilter filter, int limit);
}
