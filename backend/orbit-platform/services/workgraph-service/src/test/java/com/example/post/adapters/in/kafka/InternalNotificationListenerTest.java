package com.example.post.adapters.in.kafka;

import com.example.post.application.event.EventMessageMapper;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.port.out.NotificationClientPort;
import com.example.post.domain.NotificationRequest;
import com.example.post.domain.event.PostEventType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InternalNotificationListenerTest {

    @Test
    void fanoutSendsNotificationWithEventMetadata() {
        FriendClientPort friendClient = mock(FriendClientPort.class);
        NotificationClientPort notificationClient = mock(NotificationClientPort.class);
        EventMessageMapper mapper = mock(EventMessageMapper.class);
        InternalNotificationListener listener = new InternalNotificationListener(
                friendClient,
                notificationClient,
                mapper,
                100);

        UUID eventId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID postId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID authorId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        UUID followerId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        InternalEventMessage message = new InternalEventMessage(
                eventId,
                PostEventType.POST_CREATED.name(),
                postId,
                authorId,
                List.of("content"),
                Instant.parse("2026-01-20T14:00:00Z"),
                "{}");

        when(mapper.readInternal("raw")).thenReturn(message);
        when(friendClient.fetchFollowerIds(authorId)).thenReturn(List.of(followerId));

        listener.notifyFollowers("raw");

        ArgumentCaptor<NotificationRequest> captor = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(notificationClient).createNotification(captor.capture());
        NotificationRequest request = captor.getValue();
        assertEquals(followerId, request.userId());
        assertEquals("POST_CREATED", request.type());
        assertEquals(eventId, request.eventId());
        assertEquals(authorId, request.actorId());
        assertEquals("2026-01-20T14:00:00Z", request.occurredAt());
    }

    @Test
    void fanoutThrowsWhenAtLeastOneNotificationFails() {
        FriendClientPort friendClient = mock(FriendClientPort.class);
        NotificationClientPort notificationClient = mock(NotificationClientPort.class);
        EventMessageMapper mapper = mock(EventMessageMapper.class);
        InternalNotificationListener listener = new InternalNotificationListener(
                friendClient,
                notificationClient,
                mapper,
                1);

        UUID eventId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID postId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID authorId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        InternalEventMessage message = new InternalEventMessage(
                eventId,
                PostEventType.POST_CREATED.name(),
                postId,
                authorId,
                List.of("content"),
                Instant.parse("2026-01-20T14:00:00Z"),
                "{}");

        when(mapper.readInternal("raw")).thenReturn(message);
        when(friendClient.fetchFollowerIds(authorId)).thenReturn(List.of(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")));
        doThrow(new RuntimeException("downstream-failure"))
                .when(notificationClient)
                .createNotification(any(NotificationRequest.class));

        assertThrows(IllegalStateException.class, () -> listener.notifyFollowers("raw"));
    }
}
