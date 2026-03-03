package com.example.post.domain;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.UUID;

public record TrendingCursor(long likeCount, Instant createdAt, UUID postId) {
    public static TrendingCursor from(Post post, long likeCount) {
        if (post == null || post.createdAt() == null || post.id() == null) {
            return null;
        }
        return new TrendingCursor(likeCount, post.createdAt(), post.id());
    }

    public static TrendingCursor parse(String rawCursor) {
        if (rawCursor == null || rawCursor.isBlank()) {
            return null;
        }
        String[] parts = rawCursor.split("\\|", -1);
        if (parts.length != 3) {
            return null;
        }
        try {
            long likeCount = Long.parseLong(parts[0]);
            Instant createdAt = Instant.parse(parts[1]);
            UUID postId = UUID.fromString(parts[2]);
            return new TrendingCursor(likeCount, createdAt, postId);
        } catch (DateTimeParseException | IllegalArgumentException ex) {
            return null;
        }
    }

    public String encode() {
        return likeCount + "|" + createdAt + "|" + postId;
    }
}
