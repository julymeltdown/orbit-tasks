package com.example.friend.domain;

import java.time.Instant;
import java.util.UUID;

public record FollowEdge(UUID followerId, UUID followeeId, Instant createdAt) {
}
