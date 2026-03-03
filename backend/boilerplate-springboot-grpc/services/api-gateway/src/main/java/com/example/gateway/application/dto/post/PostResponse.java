package com.example.gateway.application.dto.post;

public record PostResponse(
        String id,
        String authorId,
        String content,
        String visibility,
        String createdAt,
        long commentCount,
        long likeCount,
        boolean likedByMe) {
}
