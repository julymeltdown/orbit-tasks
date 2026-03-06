package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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
@RequestMapping
public class ThreadController {
    private final Map<UUID, ThreadView> threads = new ConcurrentHashMap<>();
    private final Map<UUID, List<MessageView>> messagesByThread = new ConcurrentHashMap<>();
    private final Map<String, List<InboxItemView>> inboxByUser = new ConcurrentHashMap<>();

    @PostMapping("/api/collaboration/threads")
    public ThreadView createThreadLegacy(@Valid @RequestBody CreateThreadRequest request) {
        return createThreadV2(request);
    }

    @PostMapping("/api/v2/threads")
    public ThreadView createThreadV2(@Valid @RequestBody CreateThreadRequest request) {
        Instant now = Instant.now();
        ThreadView thread = new ThreadView(
                UUID.randomUUID(),
                UUID.fromString(request.workspaceId()),
                UUID.fromString(request.workItemId()),
                normalizeTitle(request.workItemTitle()),
                request.title().trim(),
                request.createdBy(),
                "OPEN",
                now.toString(),
                buildSourceSummary(request.title(), request.workItemTitle()),
                "/app/projects/board",
                0,
                null,
                null,
                "Open the thread, confirm owner, and leave the next update.");
        threads.put(thread.threadId(), thread);
        messagesByThread.putIfAbsent(thread.threadId(), new ArrayList<>());
        return thread;
    }

    @GetMapping("/api/v2/threads/{threadId}")
    public ThreadView getThreadV2(@PathVariable UUID threadId) {
        return requireThread(threadId);
    }

    @PostMapping("/api/collaboration/threads/{threadId}/messages")
    public MessageView postMessageLegacy(@PathVariable UUID threadId, @Valid @RequestBody PostMessageRequest request) {
        return postMessageV2(threadId, request);
    }

    @PostMapping("/api/v2/threads/{threadId}/messages")
    public MessageView postMessageV2(@PathVariable UUID threadId, @Valid @RequestBody PostMessageRequest request) {
        ThreadView thread = requireThread(threadId);
        Instant now = Instant.now();
        MessageView message = new MessageView(UUID.randomUUID(), threadId, request.authorId(), request.body(), now.toString());
        messagesByThread.computeIfAbsent(threadId, ignored -> new ArrayList<>()).add(message);
        threads.put(threadId, withMessage(thread, message));

        for (String mentioned : parseMentions(request.body())) {
            inboxByUser.computeIfAbsent(mentioned, ignored -> new ArrayList<>()).add(new InboxItemView(
                    UUID.randomUUID(),
                    mentioned,
                    "MENTION",
                    "THREAD",
                    threadId.toString(),
                    message.messageId().toString(),
                    false,
                    "OPEN",
                    now.toString(),
                    null,
                    preview(request.body()),
                    thread.sourceSummary(),
                    resolveUrgency("MENTION", request.body()),
                    "Open thread and respond",
                    "/app/inbox?threadId=" + threadId,
                    thread.title()));
        }
        return message;
    }

    @GetMapping("/api/collaboration/threads/{threadId}/messages")
    public List<MessageView> listMessagesLegacy(@PathVariable UUID threadId) {
        return listMessagesV2(threadId);
    }

    @GetMapping("/api/v2/threads/{threadId}/messages")
    public List<MessageView> listMessagesV2(@PathVariable UUID threadId) {
        requireThread(threadId);
        return List.copyOf(messagesByThread.getOrDefault(threadId, List.of()));
    }

    @GetMapping("/api/collaboration/inbox")
    public List<InboxItemView> inboxLegacy(@RequestParam String userId) {
        return inboxV2(userId, "all");
    }

    @GetMapping("/api/v2/inbox")
    public List<InboxItemView> inboxV2(@RequestParam String userId,
                                       @RequestParam(defaultValue = "all") String filter) {
        List<InboxItemView> source = inboxByUser.getOrDefault(userId, List.of());
        List<InboxItemView> sorted = source.stream()
                .sorted(Comparator.comparing(InboxItemView::createdAt).reversed())
                .toList();

        if ("all".equalsIgnoreCase(filter)) {
            return sorted;
        }
        if ("mentions".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> "MENTION".equals(item.kind())).toList();
        }
        if ("requests".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> "REQUEST".equals(item.kind())).toList();
        }
        if ("notifications".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> "NOTIFICATION".equals(item.kind())).toList();
        }
        if ("ai_questions".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> "AI_QUESTION".equals(item.kind())).toList();
        }
        if ("needs_action".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> !"RESOLVED".equals(item.status())).toList();
        }
        if ("resolved".equalsIgnoreCase(filter)) {
            return sorted.stream().filter(item -> "RESOLVED".equals(item.status())).toList();
        }
        return sorted;
    }

    @PatchMapping("/api/collaboration/inbox/{notificationId}/read")
    public InboxItemView markReadLegacy(@PathVariable UUID notificationId, @Valid @RequestBody MarkReadRequest request) {
        return patchInboxV2(notificationId, new PatchInboxRequest(request.userId(), "READ", null));
    }

    @PatchMapping("/api/collaboration/inbox/{notificationId}/resolve")
    public InboxItemView resolveLegacy(@PathVariable UUID notificationId, @Valid @RequestBody ResolveInboxRequest request) {
        return patchInboxV2(notificationId, new PatchInboxRequest(request.userId(), "RESOLVED", request.note()));
    }

    @PatchMapping("/api/v2/inbox/{inboxItemId}")
    public InboxItemView patchInboxV2(@PathVariable UUID inboxItemId,
                                      @Valid @RequestBody PatchInboxRequest request) {
        List<InboxItemView> current = inboxByUser.getOrDefault(request.userId(), List.of());
        for (int i = 0; i < current.size(); i++) {
            InboxItemView item = current.get(i);
            if (item.inboxItemId().equals(inboxItemId)) {
                String status = request.status() == null || request.status().isBlank() ? item.status() : request.status();
                InboxItemView updated = new InboxItemView(
                        item.inboxItemId(),
                        item.userId(),
                        item.kind(),
                        item.sourceType(),
                        item.sourceId(),
                        item.messageId(),
                        "READ".equalsIgnoreCase(status) || "RESOLVED".equalsIgnoreCase(status),
                        status.toUpperCase(Locale.ROOT),
                        item.createdAt(),
                        "RESOLVED".equalsIgnoreCase(status) ? Instant.now().toString() : item.resolvedAt(),
                        item.preview(),
                        item.sourceSummary(),
                        item.urgency(),
                        item.nextActionLabel(),
                        item.sourcePath(),
                        item.threadTitle());
                current.set(i, updated);
                return updated;
            }
        }
        throw new IllegalArgumentException("INVALID_SCOPE");
    }

    private ThreadView requireThread(UUID threadId) {
        ThreadView thread = threads.get(threadId);
        if (thread == null) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
        return thread;
    }

    private ThreadView withMessage(ThreadView thread, MessageView message) {
        return new ThreadView(
                thread.threadId(),
                thread.workspaceId(),
                thread.workItemId(),
                thread.workItemTitle(),
                thread.title(),
                thread.createdBy(),
                thread.status(),
                thread.createdAt(),
                thread.sourceSummary(),
                thread.sourcePath(),
                thread.messageCount() + 1,
                preview(message.body()),
                message.createdAt(),
                thread.resolutionHint());
    }

    private String buildSourceSummary(String threadTitle, String workItemTitle) {
        if (workItemTitle == null || workItemTitle.isBlank()) {
            return threadTitle.trim();
        }
        return threadTitle.trim() + " · " + normalizeTitle(workItemTitle);
    }

    private String normalizeTitle(String rawTitle) {
        if (rawTitle == null || rawTitle.isBlank()) {
            return "Untitled Task";
        }
        return rawTitle.trim();
    }

    private String preview(String body) {
        if (body == null || body.isBlank()) {
            return "No preview available";
        }
        String normalized = body.replaceAll("\\s+", " ").trim();
        return normalized.length() > 120 ? normalized.substring(0, 117) + "..." : normalized;
    }

    private String resolveUrgency(String kind, String body) {
        String lowered = body == null ? "" : body.toLowerCase(Locale.ROOT);
        if (lowered.contains("block") || lowered.contains("urgent") || lowered.contains("긴급") || lowered.contains("asap")) {
            return "HIGH";
        }
        if ("AI_QUESTION".equals(kind) || "REQUEST".equals(kind) || lowered.contains("eta")) {
            return "MEDIUM";
        }
        return "LOW";
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

    public record CreateThreadRequest(
            @NotBlank String workspaceId,
            @NotBlank String workItemId,
            String workItemTitle,
            @NotBlank String title,
            @NotBlank String createdBy) {
    }

    public record PostMessageRequest(@NotBlank String authorId, @NotBlank String body) {
    }

    public record MarkReadRequest(@NotBlank String userId) {
    }

    public record ResolveInboxRequest(@NotBlank String userId, String note) {
    }

    public record PatchInboxRequest(@NotBlank String userId, String status, String note) {
    }

    public record ThreadView(
            UUID threadId,
            UUID workspaceId,
            UUID workItemId,
            String workItemTitle,
            String title,
            String createdBy,
            String status,
            String createdAt,
            String sourceSummary,
            String sourcePath,
            int messageCount,
            String lastMessagePreview,
            String lastMessageAt,
            String resolutionHint) {
    }

    public record MessageView(UUID messageId, UUID threadId, String authorId, String body, String createdAt) {
    }

    public record InboxItemView(
            UUID inboxItemId,
            String userId,
            String kind,
            String sourceType,
            String sourceId,
            String messageId,
            boolean read,
            String status,
            String createdAt,
            String resolvedAt,
            String preview,
            String sourceSummary,
            String urgency,
            String nextActionLabel,
            String sourcePath,
            String threadTitle
    ) {
    }
}
