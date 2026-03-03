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
@Table(
        name = "post_comments",
        indexes = {
                @Index(name = "ix_post_comments_post_id_commented_at", columnList = "post_id,commented_at")
        }
)
public class CommentEntity extends BaseAuditEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "commented_at", nullable = false)
    private Instant commentedAt;
}
