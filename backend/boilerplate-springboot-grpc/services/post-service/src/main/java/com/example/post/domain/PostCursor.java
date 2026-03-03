package com.example.post.domain;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.UUID;

public record PostCursor(Instant createdAt, UUID postId) {
    private static final UUID MAX_UUID = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");

    public static PostCursor from(Post post) {
        if (post == null || post.createdAt() == null || post.id() == null) {
            return null;
        }
        return new PostCursor(post.createdAt(), post.id());
    }

    public static PostCursor parse(String rawCursor) {
        if (rawCursor == null || rawCursor.isBlank()) {
            return null;
        }
        String[] parts = rawCursor.split("\\|", -1);
        if (parts.length == 0) {
            return null;
        }
        try {
            Instant createdAt = Instant.parse(parts[0]);
            UUID postId = parts.length >= 2 && !parts[1].isBlank() ? UUID.fromString(parts[1]) : MAX_UUID;
            return new PostCursor(createdAt, postId);
        } catch (DateTimeParseException | IllegalArgumentException ex) {
            return null;
        }
    }

    public String encode() {
        return createdAt + "|" + postId;
    }
}
