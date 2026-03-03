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
        name = "posts",
        indexes = {
                @Index(name = "ix_posts_author_posted_at", columnList = "author_id,posted_at"),
                @Index(name = "ix_posts_posted_at", columnList = "posted_at"),
                @Index(name = "ix_posts_like_posted", columnList = "like_count,posted_at")
        }
)
public class PostEntity extends BaseAuditEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "visibility", nullable = false)
    private String visibility;

    @Column(name = "posted_at", nullable = false)
    private Instant postedAt;

    @Column(name = "comment_count", nullable = false)
    private long commentCount;

    @Column(name = "like_count", nullable = false)
    private long likeCount;
}
