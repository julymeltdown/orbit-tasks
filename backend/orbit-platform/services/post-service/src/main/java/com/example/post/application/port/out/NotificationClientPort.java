package com.example.post.application.port.out;

import com.example.post.domain.NotificationRequest;

public interface NotificationClientPort {
    void createNotification(NotificationRequest request);
}
