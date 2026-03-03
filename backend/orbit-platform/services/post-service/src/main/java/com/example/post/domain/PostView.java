package com.example.post.domain;

import java.time.Instant;
import java.util.UUID;

public record PostView(
        UUID id,
        UUID authorId,
        String content,
        String visibility,
        Instant createdAt,
        long commentCount,
        long likeCount,
        boolean likedByViewer
) {
}
