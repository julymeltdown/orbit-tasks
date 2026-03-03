package com.example.notification.adapters.out.memory;

import com.example.notification.application.port.out.NotificationRepositoryPort;
import com.example.notification.domain.Notification;
import com.example.notification.domain.NotificationPage;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "notification.persistence.mode", havingValue = "memory")
public class InMemoryNotificationRepository implements NotificationRepositoryPort {
    private final Map<String, Deque<Notification>> notificationsByUserId = new ConcurrentHashMap<>();

    @Override
    public Notification save(Notification notification) {
        notificationsByUserId
                .computeIfAbsent(notification.userId(), ignored -> new ConcurrentLinkedDeque<>())
                .addFirst(notification);
        return notification;
    }

    @Override
    public Optional<Notification> findByEventIdAndType(String userId, String eventId, String type) {
        Deque<Notification> deque = notificationsByUserId.getOrDefault(userId, new ConcurrentLinkedDeque<>());
        for (Notification notification : deque) {
            if (eventId.equals(notification.eventId()) && type.equals(notification.type())) {
                return Optional.of(notification);
            }
        }
        return Optional.empty();
    }

    @Override
    public Optional<Notification> findById(String userId, String notificationId) {
        Deque<Notification> deque = notificationsByUserId.getOrDefault(userId, new ConcurrentLinkedDeque<>());
        for (Notification notification : deque) {
            if (notification.id().equals(notificationId)) {
                return Optional.of(notification);
            }
        }
        return Optional.empty();
    }

    @Override
    public NotificationPage list(String userId, String cursor, int limit) {
        Deque<Notification> deque = notificationsByUserId.getOrDefault(userId, new ConcurrentLinkedDeque<>());

        CursorKey cursorKey = parseCursor(cursor);

        List<Notification> items = new ArrayList<>();
        boolean hasMore = false;
        boolean pastCursor = cursorKey == null;
        for (Notification notification : deque) {
            if (!pastCursor) {
                if (isOlderThanCursor(notification, cursorKey)) {
                    pastCursor = true;
                } else {
                    continue;
                }
            }

            if (items.size() < limit) {
                items.add(notification);
            } else {
                hasMore = true;
                break;
            }
        }

        String nextCursor = null;
        if (hasMore && !items.isEmpty()) {
            nextCursor = toCursor(items.get(items.size() - 1));
        }

        return new NotificationPage(items, nextCursor);
    }

    @Override
    public void markRead(String userId, String notificationId, Instant readAt) {
        Deque<Notification> deque = notificationsByUserId.getOrDefault(userId, new ConcurrentLinkedDeque<>());
        List<Notification> items = new ArrayList<>(deque);
        deque.clear();
        for (Notification item : items) {
            if (item.id().equals(notificationId) && item.readAt() == null) {
                deque.addLast(new Notification(
                        item.id(),
                        item.userId(),
                        item.eventId(),
                        item.actorId(),
                        item.type(),
                        item.payloadJson(),
                        item.occurredAt(),
                        item.createdAt(),
                        readAt));
                continue;
            }
            deque.addLast(item);
        }
    }

    @Override
    public long markAllRead(String userId, Instant readAt) {
        Deque<Notification> deque = notificationsByUserId.getOrDefault(userId, new ConcurrentLinkedDeque<>());
        List<Notification> items = new ArrayList<>(deque);
        long updated = 0L;
        deque.clear();
        for (Notification item : items) {
            if (item.readAt() == null) {
                updated++;
                deque.addLast(new Notification(
                        item.id(),
                        item.userId(),
                        item.eventId(),
                        item.actorId(),
                        item.type(),
                        item.payloadJson(),
                        item.occurredAt(),
                        item.createdAt(),
                        readAt));
                continue;
            }
            deque.addLast(item);
        }
        return updated;
    }

    @Override
    public void clear() {
        notificationsByUserId.clear();
    }

    private static String toCursor(Notification notification) {
        Instant createdAt = notification.createdAt();
        long epochMilli = createdAt == null ? 0 : createdAt.toEpochMilli();
        return epochMilli + ":" + notification.id();
    }

    private static CursorKey parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        String[] parts = cursor.split(":", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid cursor format");
        }
        try {
            long epochMilli = Long.parseLong(parts[0]);
            String id = parts[1];
            if (id == null || id.isBlank()) {
                throw new IllegalArgumentException("Invalid cursor format");
            }
            return new CursorKey(epochMilli, id);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid cursor format", ex);
        }
    }

    private static boolean isOlderThanCursor(Notification notification, CursorKey cursorKey) {
        Instant createdAt = notification.createdAt();
        long epochMilli = createdAt == null ? 0 : createdAt.toEpochMilli();

        if (epochMilli < cursorKey.epochMilli) {
            return true;
        }
        if (epochMilli > cursorKey.epochMilli) {
            return false;
        }
        return notification.id().compareTo(cursorKey.id) < 0;
    }

    private record CursorKey(long epochMilli, String id) {
    }
}
