package com.example.notification.adapters.out.persistence;

import com.example.notification.application.port.out.NotificationRepositoryPort;
import com.example.notification.domain.Notification;
import com.example.notification.domain.NotificationPage;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "notification.persistence.mode", havingValue = "jpa", matchIfMissing = true)
public class NotificationJpaRepositoryAdapter implements NotificationRepositoryPort {
    private final NotificationJpaRepository repository;

    public NotificationJpaRepositoryAdapter(NotificationJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public Notification save(Notification notification) {
        return toDomain(repository.save(toEntity(notification)));
    }

    @Override
    public Optional<Notification> findByEventIdAndType(String userId, String eventId, String type) {
        return repository.findByRecipientUserIdAndEventIdAndType(userId, eventId, type).map(this::toDomain);
    }

    @Override
    public Optional<Notification> findById(String userId, String notificationId) {
        return repository.findByRecipientUserIdAndId(userId, notificationId).map(this::toDomain);
    }

    @Override
    public NotificationPage list(String userId, String cursor, int limit) {
        CursorKey cursorKey = parseCursor(cursor);
        List<NotificationEntity> entities = repository.findPage(
                userId,
                cursorKey == null ? null : cursorKey.createdAt,
                cursorKey == null ? null : cursorKey.id,
                PageRequest.of(0, limit + 1));

        boolean hasMore = entities.size() > limit;
        int resultSize = hasMore ? limit : entities.size();
        List<Notification> items = new ArrayList<>(resultSize);
        for (int i = 0; i < resultSize; i++) {
            items.add(toDomain(entities.get(i)));
        }

        String nextCursor = null;
        if (hasMore && !items.isEmpty()) {
            nextCursor = toCursor(items.get(items.size() - 1));
        }
        return new NotificationPage(items, nextCursor);
    }

    @Override
    @Transactional
    public void markRead(String userId, String notificationId, Instant readAt) {
        repository.markRead(userId, notificationId, readAt);
    }

    @Override
    @Transactional
    public long markAllRead(String userId, Instant readAt) {
        return repository.markAllRead(userId, readAt);
    }

    @Override
    @Transactional
    public void clear() {
        repository.deleteAllInBatch();
    }

    private NotificationEntity toEntity(Notification notification) {
        NotificationEntity entity = new NotificationEntity();
        entity.setId(notification.id());
        entity.setRecipientUserId(notification.userId());
        entity.setEventId(notification.eventId());
        entity.setActorUserId(notification.actorId());
        entity.setType(notification.type());
        entity.setPayloadJson(notification.payloadJson());
        entity.setOccurredAt(notification.occurredAt());
        entity.setCreatedAt(notification.createdAt());
        entity.setReadAt(notification.readAt());
        return entity;
    }

    private Notification toDomain(NotificationEntity entity) {
        return new Notification(
                entity.getId(),
                entity.getRecipientUserId(),
                entity.getEventId(),
                entity.getActorUserId(),
                entity.getType(),
                entity.getPayloadJson(),
                entity.getOccurredAt(),
                entity.getCreatedAt(),
                entity.getReadAt());
    }

    private static String toCursor(Notification notification) {
        return notification.createdAt().toEpochMilli() + ":" + notification.id();
    }

    private static CursorKey parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        String[] parts = cursor.split(":", 2);
        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("Invalid cursor format");
        }
        try {
            long epochMillis = Long.parseLong(parts[0]);
            return new CursorKey(Instant.ofEpochMilli(epochMillis), parts[1]);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid cursor format", ex);
        }
    }

    private record CursorKey(Instant createdAt, String id) {
    }
}
