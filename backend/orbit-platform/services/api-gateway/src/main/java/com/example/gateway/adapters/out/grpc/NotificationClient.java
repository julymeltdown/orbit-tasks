package com.example.gateway.adapters.out.grpc;

import com.example.gateway.application.dto.notification.NotificationFeedResponse;
import com.example.gateway.application.dto.notification.NotificationMarkAllReadResponse;
import com.example.gateway.application.dto.notification.NotificationResponse;
import com.example.gateway.application.port.out.NotificationClientPort;
import com.example.notification.v1.ListNotificationsRequest;
import com.example.notification.v1.MarkAllNotificationsReadRequest;
import com.example.notification.v1.MarkNotificationReadRequest;
import com.example.notification.v1.NotificationServiceGrpc;
import org.springframework.stereotype.Component;

@Component
public class NotificationClient implements NotificationClientPort {
    private final NotificationServiceGrpc.NotificationServiceBlockingStub stub;

    public NotificationClient(NotificationServiceGrpc.NotificationServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public NotificationFeedResponse listNotifications(String userId, String cursor, int limit) {
        ListNotificationsRequest.Builder builder = ListNotificationsRequest.newBuilder()
                .setUserId(userId)
                .setLimit(limit);
        if (cursor != null && !cursor.isBlank()) {
            builder.setCursor(cursor);
        }
        var response = stub.listNotifications(builder.build());
        return new NotificationFeedResponse(
                response.getItemsList().stream().map(this::toResponse).toList(),
                response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public NotificationResponse markRead(String userId, String notificationId) {
        var response = stub.markNotificationRead(MarkNotificationReadRequest.newBuilder()
                .setUserId(userId)
                .setNotificationId(notificationId)
                .build());
        return toResponse(response.getNotification());
    }

    @Override
    public NotificationMarkAllReadResponse markAllRead(String userId) {
        var response = stub.markAllNotificationsRead(MarkAllNotificationsReadRequest.newBuilder()
                .setUserId(userId)
                .build());
        return new NotificationMarkAllReadResponse(response.getUpdatedCount());
    }

    private NotificationResponse toResponse(com.example.notification.v1.Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getType(),
                notification.getPayloadJson(),
                notification.getCreatedAt(),
                notification.getReadAt().isBlank() ? null : notification.getReadAt());
    }
}
