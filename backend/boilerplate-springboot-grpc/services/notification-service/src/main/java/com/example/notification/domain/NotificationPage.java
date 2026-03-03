package com.example.notification.domain;

import java.util.List;

public record NotificationPage(
        List<Notification> items,
        String nextCursor
) {
}
