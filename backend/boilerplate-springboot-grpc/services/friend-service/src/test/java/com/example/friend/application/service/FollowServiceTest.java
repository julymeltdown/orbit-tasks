package com.example.friend.application.service;

import com.example.friend.adapters.out.memory.InMemoryFollowRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FollowServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);

    @Test
    void rejectsSelfFollow() {
        FollowService service = new FollowService(new InMemoryFollowRepository(), clock);
        UUID userId = UUID.randomUUID();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.follow(userId, userId));

        assertEquals("Cannot follow yourself", exception.getMessage());
    }

    @Test
    void rejectsSelfUnfollow() {
        FollowService service = new FollowService(new InMemoryFollowRepository(), clock);
        UUID userId = UUID.randomUUID();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.unfollow(userId, userId));

        assertEquals("Cannot unfollow yourself", exception.getMessage());
    }

    @Test
    void rejectsNullBatchCountsInput() {
        FollowService service = new FollowService(new InMemoryFollowRepository(), clock);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.batchCounts(null));

        assertEquals("User IDs are required", exception.getMessage());
    }

    @Test
    void clearsAllFollowState() {
        FollowService service = new FollowService(new InMemoryFollowRepository(), clock);
        UUID followerId = UUID.randomUUID();
        UUID followeeId = UUID.randomUUID();

        service.follow(followerId, followeeId);
        assertTrue(service.isFollowing(followerId, followeeId));

        service.clearAll();

        assertTrue(!service.isFollowing(followerId, followeeId));
        assertEquals(0L, service.counts(followeeId).followerCount());
        assertEquals(0L, service.batchCounts(List.of(followerId)).get(followerId).followingCount());
    }
}
