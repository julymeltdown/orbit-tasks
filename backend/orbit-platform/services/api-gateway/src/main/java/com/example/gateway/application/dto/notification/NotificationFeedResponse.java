package com.example.gateway.application.dto.notification;

import java.util.List;

public record NotificationFeedResponse(
        List<NotificationResponse> items,
        String nextCursor) {
}
