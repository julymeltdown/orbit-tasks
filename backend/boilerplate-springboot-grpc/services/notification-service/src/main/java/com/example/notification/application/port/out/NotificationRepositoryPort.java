package com.example.notification.application.port.out;

import com.example.notification.domain.Notification;
import com.example.notification.domain.NotificationPage;
import java.time.Instant;
import java.util.Optional;

public interface NotificationRepositoryPort {
    Notification save(Notification notification);

    Optional<Notification> findByEventIdAndType(String userId, String eventId, String type);

    Optional<Notification> findById(String userId, String notificationId);

    NotificationPage list(String userId, String cursor, int limit);

    void markRead(String userId, String notificationId, Instant readAt);

    long markAllRead(String userId, Instant readAt);

    void clear();
}
