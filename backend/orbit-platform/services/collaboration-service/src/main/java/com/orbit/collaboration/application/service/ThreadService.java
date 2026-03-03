package com.orbit.collaboration.application.service;

import com.orbit.collaboration.domain.Mention;
import com.orbit.collaboration.domain.Thread;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ThreadService {
    private final Map<UUID, Thread> threads = new ConcurrentHashMap<>();
    private final Map<UUID, List<Message>> messagesByThread = new ConcurrentHashMap<>();
    private final Map<String, List<InboxNotification>> inboxByUser = new ConcurrentHashMap<>();

    public Thread create(UUID workspaceId, UUID workItemId, String title, String actor) {
        Thread thread = new Thread(UUID.randomUUID(), workspaceId, workItemId, title, Thread.Status.OPEN, actor, Instant.now(), null);
        threads.put(thread.id(), thread);
        messagesByThread.putIfAbsent(thread.id(), new ArrayList<>());
        return thread;
    }

    public Message post(UUID threadId, String actor, String body) {
        Thread thread = threads.get(threadId);
        if (thread == null) {
            throw new IllegalArgumentException("Thread not found");
        }
        Message message = new Message(UUID.randomUUID(), threadId, actor, body, Instant.now());
        messagesByThread.computeIfAbsent(threadId, ignored -> new ArrayList<>()).add(message);

        List<Mention> mentions = Mention.parseFrom(message.messageId(), body);
        for (Mention mention : mentions) {
            inboxByUser.computeIfAbsent(mention.mentionedUser(), ignored -> new ArrayList<>())
                    .add(new InboxNotification(
                            UUID.randomUUID(),
                            mention.mentionedUser(),
                            threadId,
                            message.messageId(),
                            "MENTION",
                            false,
                            Instant.now()));
        }

        return message;
    }

    public List<Message> listMessages(UUID threadId) {
        return List.copyOf(messagesByThread.getOrDefault(threadId, List.of()));
    }

    public List<InboxNotification> inbox(String userId) {
        return List.copyOf(inboxByUser.getOrDefault(userId, List.of()));
    }

    public void markRead(String userId, UUID notificationId) {
        List<InboxNotification> current = inboxByUser.getOrDefault(userId, List.of());
        for (int i = 0; i < current.size(); i++) {
            InboxNotification item = current.get(i);
            if (item.notificationId().equals(notificationId)) {
                current.set(i, item.read());
                return;
            }
        }
    }

    public record Message(UUID messageId, UUID threadId, String authorId, String body, Instant createdAt) {
    }

    public record InboxNotification(
            UUID notificationId,
            String userId,
            UUID threadId,
            UUID messageId,
            String type,
            boolean isRead,
            Instant createdAt
    ) {
        InboxNotification read() {
            return new InboxNotification(notificationId, userId, threadId, messageId, type, true, createdAt);
        }
    }
}
