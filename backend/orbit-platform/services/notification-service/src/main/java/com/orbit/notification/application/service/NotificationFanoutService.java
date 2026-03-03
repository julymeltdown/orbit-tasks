package com.orbit.notification.application.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class NotificationFanoutService {
    private final Map<String, List<NotificationSignal>> signalsByUser = new ConcurrentHashMap<>();

    public NotificationSignal fanoutMention(String workspaceId,
                                            String mentionedUser,
                                            String threadId,
                                            String messageId,
                                            String actor) {
        NotificationSignal signal = new NotificationSignal(
                UUID.randomUUID().toString(),
                workspaceId,
                mentionedUser,
                "mention",
                threadId,
                messageId,
                actor,
                false,
                Instant.now().toString());
        signalsByUser.computeIfAbsent(mentionedUser, ignored -> new ArrayList<>()).add(signal);
        return signal;
    }

    public NotificationSignal fanoutThreadReply(String workspaceId,
                                                String subscriber,
                                                String threadId,
                                                String messageId,
                                                String actor) {
        NotificationSignal signal = new NotificationSignal(
                UUID.randomUUID().toString(),
                workspaceId,
                subscriber,
                "thread_reply",
                threadId,
                messageId,
                actor,
                false,
                Instant.now().toString());
        signalsByUser.computeIfAbsent(subscriber, ignored -> new ArrayList<>()).add(signal);
        return signal;
    }

    public List<NotificationSignal> listInbox(String userId) {
        return List.copyOf(signalsByUser.getOrDefault(userId, List.of()));
    }

    public record NotificationSignal(
            String notificationId,
            String workspaceId,
            String userId,
            String type,
            String threadId,
            String messageId,
            String actor,
            boolean read,
            String createdAt
    ) {
    }
}
