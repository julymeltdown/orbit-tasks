package com.example.post.domain;

import java.util.UUID;

public record ProfileSnapshot(
        UUID userId,
        String nickname,
        String avatarUrl,
        String bio) {
}
