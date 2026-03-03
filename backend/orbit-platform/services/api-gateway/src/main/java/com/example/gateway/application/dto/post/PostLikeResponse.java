package com.example.gateway.application.dto.post;

public record PostLikeResponse(
        String postId,
        long likeCount,
        boolean liked
) {
}
