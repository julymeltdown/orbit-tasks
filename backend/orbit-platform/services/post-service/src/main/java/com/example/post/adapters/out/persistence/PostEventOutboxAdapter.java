package com.example.post.adapters.out.persistence;

import com.example.post.application.event.EventReplayFilter;
import com.example.post.application.event.StoredEvent;
import com.example.post.application.port.out.EventStorePort;
import com.example.post.domain.event.DomainEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Repository
public class PostEventOutboxAdapter implements EventStorePort {
    private static final TypeReference<List<String>> ATTRIBUTES_TYPE = new TypeReference<>() {};

    private final PostEventOutboxJpaRepository repository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @PersistenceContext
    private EntityManager entityManager;

    public PostEventOutboxAdapter(PostEventOutboxJpaRepository repository,
                                 ObjectMapper objectMapper,
                                 Clock clock) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    @Transactional
    public StoredEvent save(DomainEvent event) {
        PostEventOutboxEntity entity = new PostEventOutboxEntity();
        entity.setId(event.eventId());
        entity.setAggregateId(event.aggregateId());
        entity.setActorId(event.actorId());
        entity.setEventType(event.eventType());
        entity.setAttributesJson(writeJson(event.attributes()));
        entity.setPayloadJson(writeJson(event));
        entity.setOccurredAt(event.occurredAt());
        entity.setCreatedAt(clock.instant());
        entity.setPublished(false);
        entity.setPublishedAt(null);
        PostEventOutboxEntity saved = repository.save(entity);
        return toStored(saved);
    }

    @Override
    public Optional<StoredEvent> findById(UUID eventId) {
        return repository.findById(eventId).map(this::toStored);
    }

    @Override
    @Transactional
    public void markPublished(UUID eventId, Instant publishedAt) {
        repository.findById(eventId).ifPresent(entity -> {
            entity.setPublished(true);
            entity.setPublishedAt(publishedAt);
            repository.save(entity);
        });
    }

    @Override
    public List<StoredEvent> findUnpublished(Instant olderThan, int limit) {
        if (olderThan == null || limit <= 0) {
            return List.of();
        }
        return repository.findByPublishedFalseAndCreatedAtBefore(olderThan, PageRequest.of(0, limit)).stream()
                .map(this::toStored)
                .toList();
    }

    @Override
    public List<StoredEvent> findEvents(EventReplayFilter filter, int limit) {
        if (filter == null) {
            return List.of();
        }
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<PostEventOutboxEntity> query = builder.createQuery(PostEventOutboxEntity.class);
        Root<PostEventOutboxEntity> root = query.from(PostEventOutboxEntity.class);

        List<Predicate> predicates = new ArrayList<>();
        if (filter.actorId() != null) {
            predicates.add(builder.equal(root.get("actorId"), filter.actorId()));
        }
        if (filter.eventType() != null && !filter.eventType().isBlank()) {
            predicates.add(builder.equal(root.get("eventType"), filter.eventType()));
        }
        if (filter.published() != null) {
            predicates.add(builder.equal(root.get("published"), filter.published()));
        }
        if (filter.from() != null) {
            predicates.add(builder.greaterThanOrEqualTo(root.get("occurredAt"), filter.from()));
        }
        if (filter.to() != null) {
            predicates.add(builder.lessThanOrEqualTo(root.get("occurredAt"), filter.to()));
        }
        if (filter.attribute() != null && !filter.attribute().isBlank()) {
            predicates.add(builder.like(root.get("attributesJson"), "%\"" + filter.attribute() + "\"%"));
        }

        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(builder.desc(root.get("occurredAt")));

        int max = limit > 0 ? limit : 100;
        return entityManager.createQuery(query)
                .setMaxResults(max)
                .getResultList()
                .stream()
                .map(this::toStored)
                .toList();
    }

    private StoredEvent toStored(PostEventOutboxEntity entity) {
        List<String> attributes = readAttributes(entity.getAttributesJson());
        return new StoredEvent(
                entity.getId(),
                entity.getEventType(),
                entity.getAggregateId(),
                entity.getActorId(),
                attributes,
                entity.getPayloadJson(),
                entity.getOccurredAt(),
                entity.getCreatedAt(),
                entity.isPublished(),
                entity.getPublishedAt()
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException ex) {
            return "{}";
        }
    }

    private List<String> readAttributes(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, ATTRIBUTES_TYPE);
        } catch (JacksonException ex) {
            return Collections.emptyList();
        }
    }
}
