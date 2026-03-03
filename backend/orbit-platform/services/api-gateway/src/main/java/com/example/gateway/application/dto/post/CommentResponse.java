package com.example.gateway.application.dto.post;

public record CommentResponse(
        String id,
        String postId,
        String authorId,
        String content,
        String createdAt) {
}
