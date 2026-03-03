package com.example.gateway.application.dto.notification;

public record NotificationResponse(
        String id,
        String userId,
        String type,
        String payloadJson,
        String createdAt,
        String readAt) {
}
