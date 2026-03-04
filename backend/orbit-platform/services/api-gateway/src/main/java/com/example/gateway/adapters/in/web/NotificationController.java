package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.notification.NotificationFeedResponse;
import com.example.gateway.application.dto.notification.NotificationMarkAllReadResponse;
import com.example.gateway.application.dto.notification.NotificationResponse;
import com.example.gateway.application.service.NotificationGatewayService;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationGatewayService notificationService;

    public NotificationController(NotificationGatewayService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationFeedResponse listNotifications(
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return notificationService.listNotifications(userId, cursor, limit);
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markRead(@PathVariable String notificationId,
                                         JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return notificationService.markRead(userId, notificationId);
    }

    @PatchMapping("/{notificationId}/resolve")
    public NotificationResponse resolve(@PathVariable String notificationId,
                                        JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return notificationService.markRead(userId, notificationId);
    }

    @PatchMapping("/read-all")
    public NotificationMarkAllReadResponse markAllRead(JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return notificationService.markAllRead(userId);
    }
}
