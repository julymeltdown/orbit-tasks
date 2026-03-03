package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/collaboration")
public class ThreadController {
    private final Map<UUID, ThreadView> threads = new ConcurrentHashMap<>();
    private final Map<UUID, List<MessageView>> messagesByThread = new ConcurrentHashMap<>();
    private final Map<String, List<InboxItemView>> inboxByUser = new ConcurrentHashMap<>();

    @PostMapping("/threads")
    public ThreadView createThread(@Valid @RequestBody CreateThreadRequest request) {
        ThreadView thread = new ThreadView(
                UUID.randomUUID(),
                UUID.fromString(request.workspaceId()),
                UUID.fromString(request.workItemId()),
                request.title(),
                request.createdBy(),
                "OPEN",
                Instant.now().toString());
        threads.put(thread.threadId(), thread);
        messagesByThread.putIfAbsent(thread.threadId(), new ArrayList<>());
        return thread;
    }

    @PostMapping("/threads/{threadId}/messages")
    public MessageView postMessage(@PathVariable UUID threadId, @Valid @RequestBody PostMessageRequest request) {
        requireThread(threadId);
        MessageView message = new MessageView(UUID.randomUUID(), threadId, request.authorId(), request.body(), Instant.now().toString());
        messagesByThread.computeIfAbsent(threadId, ignored -> new ArrayList<>()).add(message);

        for (String mentioned : parseMentions(request.body())) {
            inboxByUser.computeIfAbsent(mentioned, ignored -> new ArrayList<>()).add(new InboxItemView(
                    UUID.randomUUID(),
                    mentioned,
                    threadId,
                    message.messageId(),
                    "MENTION",
                    false,
                    Instant.now().toString()));
        }

        return message;
    }

    @GetMapping("/threads/{threadId}/messages")
    public List<MessageView> listMessages(@PathVariable UUID threadId) {
        requireThread(threadId);
        return List.copyOf(messagesByThread.getOrDefault(threadId, List.of()));
    }

    @GetMapping("/inbox")
    public List<InboxItemView> inbox(@RequestParam String userId) {
        return List.copyOf(inboxByUser.getOrDefault(userId, List.of()));
    }

    @PatchMapping("/inbox/{notificationId}/read")
    public InboxItemView markRead(@PathVariable UUID notificationId, @Valid @RequestBody MarkReadRequest request) {
        List<InboxItemView> current = inboxByUser.getOrDefault(request.userId(), List.of());
        for (int i = 0; i < current.size(); i++) {
            InboxItemView item = current.get(i);
            if (item.notificationId().equals(notificationId)) {
                InboxItemView updated = new InboxItemView(
                        item.notificationId(),
                        item.userId(),
                        item.threadId(),
                        item.messageId(),
                        item.type(),
                        true,
                        item.createdAt());
                current.set(i, updated);
                return updated;
            }
        }
        throw new IllegalArgumentException("Notification not found");
    }

    private ThreadView requireThread(UUID threadId) {
        ThreadView thread = threads.get(threadId);
        if (thread == null) {
            throw new IllegalArgumentException("Thread not found");
        }
        return thread;
    }

    private List<String> parseMentions(String body) {
        List<String> users = new ArrayList<>();
        if (body == null || body.isBlank()) {
            return users;
        }
        String[] tokens = body.split("\\s+");
        for (String token : tokens) {
            if (token.startsWith("@") && token.length() > 1) {
                users.add(token.substring(1).replaceAll("[^a-zA-Z0-9._-]", ""));
            }
        }
        return users;
    }

    public record CreateThreadRequest(@NotBlank String workspaceId, @NotBlank String workItemId, @NotBlank String title, @NotBlank String createdBy) {
    }

    public record PostMessageRequest(@NotBlank String authorId, @NotBlank String body) {
    }

    public record MarkReadRequest(@NotBlank String userId) {
    }

    public record ThreadView(UUID threadId, UUID workspaceId, UUID workItemId, String title, String createdBy, String status, String createdAt) {
    }

    public record MessageView(UUID messageId, UUID threadId, String authorId, String body, String createdAt) {
    }

    public record InboxItemView(UUID notificationId, String userId, UUID threadId, UUID messageId, String type, boolean read, String createdAt) {
    }
}
