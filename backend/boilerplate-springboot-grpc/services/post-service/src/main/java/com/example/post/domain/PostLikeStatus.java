package com.example.post.domain;

import java.util.UUID;

public record PostLikeStatus(
        UUID postId,
        long likeCount,
        boolean liked
) {
}
