package com.example.post.domain;

import java.time.Instant;
import java.util.UUID;

public record Post(
        UUID id,
        UUID authorId,
        String content,
        String visibility,
        Instant createdAt,
        long commentCount
) {
}
