package com.example.friend.application.port.out;

import com.example.friend.domain.FollowCounts;
import com.example.friend.domain.FollowEdge;
import com.example.friend.domain.FollowPage;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepositoryPort {
    Optional<FollowEdge> follow(FollowEdge edge);

    boolean unfollow(UUID followerId, UUID followeeId);

    FollowPage listFollowers(UUID userId, String cursor, int limit);

    FollowPage listFollowing(UUID userId, String cursor, int limit);

    boolean isFollowing(UUID followerId, UUID followeeId);

    FollowCounts counts(UUID userId);

    Map<UUID, FollowCounts> batchCounts(Iterable<UUID> userIds);

    void clear();
}
