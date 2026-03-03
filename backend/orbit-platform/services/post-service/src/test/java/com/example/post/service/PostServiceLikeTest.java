package com.example.post.service;

import com.example.post.adapters.out.cache.NoopFeedCacheAdapter;
import com.example.post.adapters.out.cache.NoopPostCacheAdapter;
import com.example.post.adapters.out.memory.InMemoryPostLikeRepository;
import com.example.post.adapters.out.memory.InMemoryPostRepository;
import com.example.post.application.service.PostService;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.domain.PostLikeStatus;
import com.example.post.domain.PostView;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PostServiceLikeTest {
    @Test
    void likeIsIdempotentAndUpdatesCounts() {
        InMemoryPostRepository postRepository = new InMemoryPostRepository();
        InMemoryPostLikeRepository likeRepository = new InMemoryPostLikeRepository();
        FriendClientPort friendClient = new FriendClientPort() {
            @Override
            public List<UUID> fetchFollowingIds(UUID userId) {
                return List.of();
            }

            @Override
            public List<UUID> fetchFollowerIds(UUID userId) {
                return List.of();
            }
        };
        Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);

        PostService postService = new PostService(
                postRepository,
                likeRepository,
                new NoopFeedCacheAdapter(),
                new NoopPostCacheAdapter(),
                friendClient,
                clock,
                1000,
                event -> {}
        );
        UUID authorId = UUID.randomUUID();
        UUID likerId = UUID.randomUUID();

        PostView post = postService.createPost(authorId, "hello", "PUBLIC");

        PostLikeStatus first = postService.likePost(post.id(), likerId);
        assertTrue(first.liked());
        assertEquals(1, first.likeCount());

        PostLikeStatus second = postService.likePost(post.id(), likerId);
        assertTrue(second.liked());
        assertEquals(1, second.likeCount());

        PostLikeStatus unlike = postService.unlikePost(post.id(), likerId);
        assertFalse(unlike.liked());
        assertEquals(0, unlike.likeCount());
    }
}
