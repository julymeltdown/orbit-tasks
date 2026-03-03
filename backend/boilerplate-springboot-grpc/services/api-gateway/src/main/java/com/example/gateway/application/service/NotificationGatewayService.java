package com.example.gateway.application.service;

import com.example.gateway.application.dto.notification.NotificationFeedResponse;
import com.example.gateway.application.dto.notification.NotificationMarkAllReadResponse;
import com.example.gateway.application.dto.notification.NotificationResponse;
import com.example.gateway.application.port.out.NotificationClientPort;
import org.springframework.stereotype.Service;

@Service
public class NotificationGatewayService {
    private final NotificationClientPort notificationClient;

    public NotificationGatewayService(NotificationClientPort notificationClient) {
        this.notificationClient = notificationClient;
    }

    public NotificationFeedResponse listNotifications(String userId, String cursor, int limit) {
        return notificationClient.listNotifications(userId, cursor, limit);
    }

    public NotificationResponse markRead(String userId, String notificationId) {
        return notificationClient.markRead(userId, notificationId);
    }

    public NotificationMarkAllReadResponse markAllRead(String userId) {
        return notificationClient.markAllRead(userId);
    }
}
