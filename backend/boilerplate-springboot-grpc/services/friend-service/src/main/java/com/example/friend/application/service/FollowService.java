package com.example.friend.application.service;

import com.example.friend.application.port.out.FollowRepositoryPort;
import com.example.friend.domain.FollowCounts;
import com.example.friend.domain.FollowEdge;
import com.example.friend.domain.FollowPage;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class FollowService {
    private final FollowRepositoryPort followRepository;
    private final Clock clock;

    public FollowService(FollowRepositoryPort followRepository, Clock clock) {
        this.followRepository = followRepository;
        this.clock = clock;
    }

    public FollowEdge follow(UUID followerId, UUID followeeId) {
        validateIds(followerId, followeeId);
        if (followerId.equals(followeeId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }
        FollowEdge edge = new FollowEdge(followerId, followeeId, Instant.now(clock));
        Optional<FollowEdge> existing = followRepository.follow(edge);
        return existing.orElse(edge);
    }

    public boolean unfollow(UUID followerId, UUID followeeId) {
        validateIds(followerId, followeeId);
        if (followerId.equals(followeeId)) {
            throw new IllegalArgumentException("Cannot unfollow yourself");
        }
        return followRepository.unfollow(followerId, followeeId);
    }

    public FollowPage listFollowers(UUID userId, String cursor, int limit) {
        validateId(userId);
        return followRepository.listFollowers(userId, cursor, limit);
    }

    public FollowPage listFollowing(UUID userId, String cursor, int limit) {
        validateId(userId);
        return followRepository.listFollowing(userId, cursor, limit);
    }

    public FollowCounts counts(UUID userId) {
        validateId(userId);
        return followRepository.counts(userId);
    }

    public Map<UUID, FollowCounts> batchCounts(List<UUID> userIds) {
        if (userIds == null) {
            throw new IllegalArgumentException("User IDs are required");
        }
        return followRepository.batchCounts(userIds);
    }

    public boolean isFollowing(UUID followerId, UUID followeeId) {
        validateIds(followerId, followeeId);
        return followRepository.isFollowing(followerId, followeeId);
    }

    public void clearAll() {
        followRepository.clear();
    }

    private void validateId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("User ID is required");
        }
    }

    private void validateIds(UUID followerId, UUID followeeId) {
        if (followerId == null || followeeId == null) {
            throw new IllegalArgumentException("Follower and followee are required");
        }
    }
}
