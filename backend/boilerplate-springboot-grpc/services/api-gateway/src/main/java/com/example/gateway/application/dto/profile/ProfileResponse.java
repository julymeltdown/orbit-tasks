package com.example.gateway.application.dto.profile;

public record ProfileResponse(
        String userId,
        String username,
        String nickname,
        String avatarUrl,
        String bio,
        long followerCount,
        long followingCount,
        long postCount) {
}
