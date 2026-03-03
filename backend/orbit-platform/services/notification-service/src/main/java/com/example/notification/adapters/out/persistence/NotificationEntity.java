package com.example.notification.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notifications",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_notifications_recipient_event_type",
                        columnNames = {"recipient_user_id", "event_id", "type"})
        },
        indexes = {
                @Index(name = "ix_notifications_recipient_created",
                        columnList = "recipient_user_id,created_at,id"),
                @Index(name = "ix_notifications_recipient_read_created",
                        columnList = "recipient_user_id,read_at,created_at")
        })
@Getter
@Setter
@NoArgsConstructor
public class NotificationEntity {
    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "recipient_user_id", length = 36, nullable = false)
    private String recipientUserId;

    @Column(name = "event_id", length = 36, nullable = false)
    private String eventId;

    @Column(name = "actor_user_id", length = 36)
    private String actorUserId;

    @Column(name = "type", length = 64, nullable = false)
    private String type;

    @Lob
    @Column(name = "payload_json", nullable = false)
    private String payloadJson;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "read_at")
    private Instant readAt;
}
