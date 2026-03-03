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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "post.kafka.enabled", havingValue = "true")
public class InternalNotificationListener {
    private static final Logger log = LoggerFactory.getLogger(InternalNotificationListener.class);

    private final FriendClientPort friendClient;
    private final NotificationClientPort notificationClient;
    private final EventMessageMapper mapper;
    private final int batchSize;

    public InternalNotificationListener(FriendClientPort friendClient,
                                        NotificationClientPort notificationClient,
                                        EventMessageMapper mapper,
                                        @Value("${post.notification.batch-size:200}") int batchSize) {
        this.friendClient = friendClient;
        this.notificationClient = notificationClient;
        this.mapper = mapper;
        this.batchSize = batchSize > 0 ? batchSize : 200;
    }

    @KafkaListener(
            topics = "${post.events.internal-topic:post.internal-events}",
            groupId = "${post.events.notification-group-id:post-event-notification}"
    )
    public void notifyFollowers(String message) {
        InternalEventMessage internal = mapper.readInternal(message);
        if (!PostEventType.POST_CREATED.name().equals(internal.eventType())) {
            return;
        }
        UUID authorId = internal.actorId();
        UUID postId = internal.aggregateId();
        UUID eventId = internal.eventId() == null ? UUID.randomUUID() : internal.eventId();
        String occurredAt = internal.occurredAt() == null
                ? Instant.now().toString()
                : internal.occurredAt().toString();
        List<UUID> followerIds;
        try {
            followerIds = friendClient.fetchFollowerIds(authorId);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to fetch followers for notification fanout", ex);
        }
        if (followerIds.isEmpty()) {
            log.debug("No followers to notify for postId={} authorId={}", postId, authorId);
            return;
        }

        String payload = "{\"postId\":\"" + postId + "\",\"authorId\":\"" + authorId + "\"}";
        int failures = 0;
        int successes = 0;
        for (int i = 0; i < followerIds.size(); i += batchSize) {
            int end = Math.min(i + batchSize, followerIds.size());
            List<UUID> batch = followerIds.subList(i, end);
            for (UUID followerId : batch) {
                try {
                    notificationClient.createNotification(new NotificationRequest(
                            followerId,
                            "POST_CREATED",
                            payload,
                            eventId,
                            authorId,
                            occurredAt));
                    successes++;
                } catch (Exception ex) {
                    failures++;
                    log.warn(
                            "Failed to create notification eventId={} postId={} authorId={} followerId={}: {}",
                            eventId, postId, authorId, followerId, ex.getMessage());
                }
            }
        }
        if (failures > 0) {
            throw new IllegalStateException(
                    "Notification fanout partially failed for eventId=" + eventId
                            + " successes=" + successes + " failures=" + failures);
        }
    }
}
