package com.example.notification.application.service;

import com.example.notification.adapters.out.memory.InMemoryNotificationRepository;
import com.example.notification.domain.Notification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationServiceTest {
    private static final String USER_ID = "11111111-1111-1111-1111-111111111111";
    private static final String ACTOR_ID = "22222222-2222-2222-2222-222222222222";
    private static final String EVENT_ID = "33333333-3333-3333-3333-333333333333";

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(new InMemoryNotificationRepository());
    }

    @Test
    void createIsIdempotentByUserEventType() {
        Notification first = service.create(
                USER_ID,
                "POST_CREATED",
                "{\"postId\":\"1\"}",
                EVENT_ID,
                ACTOR_ID,
                "2026-01-20T14:00:00Z");
        Notification second = service.create(
                USER_ID,
                "POST_CREATED",
                "{\"postId\":\"1\"}",
                EVENT_ID,
                ACTOR_ID,
                "2026-01-20T14:00:00Z");

        assertEquals(first.id(), second.id());
    }

    @Test
    void listRejectsInvalidCursor() {
        assertThrows(IllegalArgumentException.class, () ->
                service.list(USER_ID, "invalid-cursor", 10));
    }

    @Test
    void markReadUpdatesSingleNotification() {
        Notification created = service.create(
                USER_ID,
                "POST_CREATED",
                "{}",
                EVENT_ID,
                ACTOR_ID,
                "2026-01-20T14:00:00Z");

        NotificationService.MarkReadResult result = service.markRead(USER_ID, created.id());

        assertTrue(result.updated());
        assertNotNull(result.notification().readAt());
    }

    @Test
    void markAllReadReturnsUpdatedCount() {
        service.create(
                USER_ID,
                "POST_CREATED",
                "{}",
                EVENT_ID,
                ACTOR_ID,
                "2026-01-20T14:00:00Z");
        service.create(
                USER_ID,
                "SYSTEM",
                "{}",
                "44444444-4444-4444-4444-444444444444",
                ACTOR_ID,
                "2026-01-20T14:00:01Z");

        long updated = service.markAllRead(USER_ID);

        assertEquals(2L, updated);
    }
}
