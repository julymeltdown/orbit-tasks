package com.example.post.service;

import com.example.post.adapters.out.cache.NoopFeedCacheAdapter;
import com.example.post.adapters.out.cache.NoopPostCacheAdapter;
import com.example.post.adapters.out.memory.InMemoryPostLikeRepository;
import com.example.post.adapters.out.memory.InMemoryPostRepository;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.service.FeedService;
import com.example.post.domain.FeedView;
import com.example.post.domain.Post;
import com.example.post.domain.PostView;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FeedServiceViewTest {
    @Test
    void feedIncludesLikeCountsAndViewerState() {
        InMemoryPostRepository postRepository = new InMemoryPostRepository();
        InMemoryPostLikeRepository likeRepository = new InMemoryPostLikeRepository();
        UUID viewerId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        Post post = new Post(UUID.randomUUID(), authorId, "hi", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);
        postRepository.save(post);
        likeRepository.addLike(post.id(), viewerId);
        likeRepository.addLike(post.id(), UUID.randomUUID());

        FriendClientPort friendClient = new FriendClientPort() {
            @Override
            public List<UUID> fetchFollowingIds(UUID userId) {
                return List.of(authorId);
            }

            @Override
            public List<UUID> fetchFollowerIds(UUID userId) {
                return List.of();
            }
        };
        FeedService feedService = new FeedService(
                postRepository,
                likeRepository,
                friendClient,
                new NoopFeedCacheAdapter(),
                new NoopPostCacheAdapter()
        );
        FeedView view = feedService.loadFeed(viewerId, null, 10);

        assertEquals(1, view.posts().size());
        PostView viewPost = view.posts().get(0);
        assertEquals(2, viewPost.likeCount());
        assertTrue(viewPost.likedByViewer());
    }
}
