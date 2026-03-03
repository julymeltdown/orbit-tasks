package com.example.profile.domain;

public record Profile(
        String userId,
        String username,
        String nickname,
        String avatarUrl,
        String bio,
        long followerCount,
        long followingCount,
        long postCount
) {
}
