package com.example.post.service;

import com.example.post.adapters.out.cache.NoopFeedCacheAdapter;
import com.example.post.adapters.out.cache.NoopPostCacheAdapter;
import com.example.post.adapters.out.memory.InMemoryPostLikeRepository;
import com.example.post.adapters.out.memory.InMemoryPostRepository;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.service.FeedService;
import com.example.post.domain.FeedView;
import com.example.post.domain.Post;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FeedServiceTrendingTest {
    @Test
    void trendingOrdersByLikeCountThenCreatedAt() {
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

        UUID authorId = UUID.randomUUID();
        Post newestHot = new Post(UUID.randomUUID(), authorId, "hot", "PUBLIC", Instant.parse("2026-01-20T12:00:00Z"), 0);
        Post olderHot = new Post(UUID.randomUUID(), authorId, "older hot", "PUBLIC", Instant.parse("2026-01-20T11:00:00Z"), 0);
        Post medium = new Post(UUID.randomUUID(), authorId, "medium", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);

        postRepository.save(newestHot);
        postRepository.save(olderHot);
        postRepository.save(medium);

        UUID liker = UUID.randomUUID();
        if (likeRepository.addLike(newestHot.id(), liker)) {
            postRepository.adjustLikeCount(newestHot.id(), 1L);
        }
        if (likeRepository.addLike(olderHot.id(), UUID.randomUUID())) {
            postRepository.adjustLikeCount(olderHot.id(), 1L);
        }
        if (likeRepository.addLike(olderHot.id(), UUID.randomUUID())) {
            postRepository.adjustLikeCount(olderHot.id(), 1L);
        }
        if (likeRepository.addLike(medium.id(), UUID.randomUUID())) {
            postRepository.adjustLikeCount(medium.id(), 1L);
        }

        FeedService feedService = new FeedService(
                postRepository,
                likeRepository,
                friendClient,
                new NoopFeedCacheAdapter(),
                new NoopPostCacheAdapter()
        );
        FeedView view = feedService.loadTrending(UUID.randomUUID(), null, 2);

        assertEquals(2, view.posts().size());
        assertEquals(olderHot.id(), view.posts().get(0).id());
        assertEquals(newestHot.id(), view.posts().get(1).id());
    }

    @Test
    void trendingCursorAdvances() {
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

        UUID authorId = UUID.randomUUID();
        Post first = new Post(UUID.randomUUID(), authorId, "first", "PUBLIC", Instant.parse("2026-01-20T12:00:00Z"), 0);
        Post second = new Post(UUID.randomUUID(), authorId, "second", "PUBLIC", Instant.parse("2026-01-20T11:00:00Z"), 0);
        postRepository.save(first);
        postRepository.save(second);

        if (likeRepository.addLike(first.id(), UUID.randomUUID())) {
            postRepository.adjustLikeCount(first.id(), 1L);
        }
        if (likeRepository.addLike(second.id(), UUID.randomUUID())) {
            postRepository.adjustLikeCount(second.id(), 1L);
        }

        FeedService feedService = new FeedService(
                postRepository,
                likeRepository,
                friendClient,
                new NoopFeedCacheAdapter(),
                new NoopPostCacheAdapter()
        );
        FeedView firstPage = feedService.loadTrending(UUID.randomUUID(), null, 1);
        FeedView secondPage = feedService.loadTrending(UUID.randomUUID(), firstPage.nextCursor(), 1);

        assertEquals(1, firstPage.posts().size());
        assertEquals(1, secondPage.posts().size());
        assertEquals(second.id(), secondPage.posts().get(0).id());
    }
}
