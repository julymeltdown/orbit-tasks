package com.example.post.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "post_event_outbox",
       indexes = {
               @Index(name = "ix_post_event_outbox_created_at_published", columnList = "createdAt,published"),
               @Index(name = "ix_post_event_outbox_event_type_created_at", columnList = "eventType,createdAt"),
               @Index(name = "ix_post_event_outbox_actor_id", columnList = "actorId")
       })
public class PostEventOutboxEntity {
    @Id
    private UUID id;

    private UUID aggregateId;

    private UUID actorId;

    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String attributesJson;

    @Column(columnDefinition = "TEXT")
    private String payloadJson;

    private Instant occurredAt;

    private Instant createdAt;

    private boolean published;

    private Instant publishedAt;
}
