package com.example.post.domain;

import java.time.Instant;
import java.util.UUID;

public record PostCreated(
        UUID postId,
        UUID authorId,
        String content,
        String visibility,
        Instant createdAt) {
}
