package com.example.notification.application.service;

import com.example.notification.application.port.out.NotificationRepositoryPort;
import com.example.notification.domain.Notification;
import com.example.notification.domain.NotificationPage;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 100;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "POST_CREATED",
            "POST_LIKED",
            "POST_COMMENTED",
            "COMMENT",
            "FRIEND_REQUEST",
            "FRIEND_ACCEPTED",
            "SYSTEM");

    private final NotificationRepositoryPort notificationRepository;

    public NotificationService(NotificationRepositoryPort notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(String userId,
                               String type,
                               String payloadJson,
                               String eventId,
                               String actorId,
                               String occurredAt) {
        String normalizedUserId = normalizeUuid(userId, "User ID is required");
        String normalizedType = normalizeType(type);
        String normalizedEventId = normalizeOrGenerateUuid(eventId);
        String normalizedActorId = normalizeOptionalUuid(actorId);
        Instant occurredAtInstant = normalizeOccurredAt(occurredAt);

        Optional<Notification> existing = notificationRepository.findByEventIdAndType(
                normalizedUserId,
                normalizedEventId,
                normalizedType);
        if (existing.isPresent()) {
            return existing.get();
        }

        Notification notification = new Notification(
                UUID.randomUUID().toString(),
                normalizedUserId,
                normalizedEventId,
                normalizedActorId,
                normalizedType,
                payloadJson == null ? "" : payloadJson,
                occurredAtInstant,
                Instant.now(),
                null);

        return notificationRepository.save(notification);
    }

    public NotificationPage list(String userId, String cursor, int limit) {
        String normalizedUserId = normalizeUuid(userId, "User ID is required");
        if (cursor != null && !cursor.isBlank()) {
            validateCursor(cursor);
        }
        int resolvedLimit = limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
        return notificationRepository.list(normalizedUserId, cursor, resolvedLimit);
    }

    public MarkReadResult markRead(String userId, String notificationId) {
        String normalizedUserId = normalizeUuid(userId, "User ID is required");
        String normalizedNotificationId = normalizeUuid(notificationId, "Notification ID is required");
        Notification existing = notificationRepository.findById(normalizedUserId, normalizedNotificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (existing.readAt() != null) {
            return new MarkReadResult(existing, false);
        }
        Instant readAt = Instant.now();
        notificationRepository.markRead(normalizedUserId, normalizedNotificationId, readAt);
        Notification updated = notificationRepository.findById(normalizedUserId, normalizedNotificationId)
                .orElse(existing);
        return new MarkReadResult(updated, true);
    }

    public long markAllRead(String userId) {
        String normalizedUserId = normalizeUuid(userId, "User ID is required");
        return notificationRepository.markAllRead(normalizedUserId, Instant.now());
    }

    public void clear() {
        notificationRepository.clear();
    }

    private static String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported notification type");
        }
        return normalized;
    }

    private static String normalizeUuid(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(errorMessage);
        }
        try {
            return UUID.fromString(value.trim()).toString();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(errorMessage, ex);
        }
    }

    private static String normalizeOptionalUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return normalizeUuid(value, "Invalid actor ID");
    }

    private static String normalizeOrGenerateUuid(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return normalizeUuid(eventId, "Invalid event ID");
    }

    private static Instant normalizeOccurredAt(String occurredAt) {
        if (occurredAt == null || occurredAt.isBlank()) {
            return Instant.now();
        }
        try {
            return Instant.parse(occurredAt.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid occurredAt", ex);
        }
    }

    private static void validateCursor(String cursor) {
        String[] parts = cursor.split(":", 2);
        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("Invalid cursor format");
        }
        try {
            Long.parseLong(parts[0]);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid cursor format", ex);
        }
    }

    public record MarkReadResult(Notification notification, boolean updated) {
    }
}
