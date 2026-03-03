package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.notification.NotificationFeedResponse;
import com.example.gateway.application.dto.notification.NotificationMarkAllReadResponse;
import com.example.gateway.application.dto.notification.NotificationResponse;

public interface NotificationClientPort {
    NotificationFeedResponse listNotifications(String userId, String cursor, int limit);

    NotificationResponse markRead(String userId, String notificationId);

    NotificationMarkAllReadResponse markAllRead(String userId);
}
