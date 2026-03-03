package com.example.post.service;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.port.out.PostCachePort;
import com.example.post.application.port.out.PostLikeRepositoryPort;
import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.application.service.FeedService;
import com.example.post.domain.FeedCachePage;
import com.example.post.domain.FeedPage;
import com.example.post.domain.FeedView;
import com.example.post.domain.Post;
import com.example.post.domain.PostCursor;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FeedServiceCachePathTest {

    @Test
    void loadFeedUsesCacheAndSkipsRepositoryFanOut() {
        PostRepositoryPort postRepository = mock(PostRepositoryPort.class);
        PostLikeRepositoryPort likeRepository = mock(PostLikeRepositoryPort.class);
        FriendClientPort friendClient = mock(FriendClientPort.class);
        FeedCachePort feedCache = mock(FeedCachePort.class);
        PostCachePort postCache = mock(PostCachePort.class);
        FeedService service = new FeedService(postRepository, likeRepository, friendClient, feedCache, postCache);

        UUID viewerId = UUID.randomUUID();
        Post newer = post(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), "newer", "2026-01-20T12:02:00Z");
        Post older = post(UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "older", "2026-01-20T12:01:00Z");
        FeedCachePage cached = new FeedCachePage(List.of(newer.id(), older.id()), "1710000000000|" + older.id());

        when(feedCache.fetchFeed(viewerId, null, 10)).thenReturn(cached);
        when(postCache.fetchPosts(List.of(newer.id(), older.id()))).thenReturn(Map.of(newer.id(), newer, older.id(), older));
        when(likeRepository.countLikes(List.of(newer.id(), older.id()))).thenReturn(Map.of(newer.id(), 4L, older.id(), 1L));
        when(likeRepository.findLikedPostIds(viewerId, List.of(newer.id(), older.id()))).thenReturn(Set.of(newer.id()));

        FeedView view = service.loadFeed(viewerId, null, 10);

        assertEquals(2, view.posts().size());
        assertEquals(newer.id(), view.posts().get(0).id());
        assertEquals(older.id(), view.posts().get(1).id());
        assertEquals(PostCursor.from(older).encode(), view.nextCursor());
        verify(postRepository, never()).fetchFeed(any(), any(), anyInt());
        verify(friendClient, never()).fetchFollowingIds(any());
    }

    @Test
    void loadFeedResolvesMissingPostsFromRepositoryAndWarmsCache() {
        PostRepositoryPort postRepository = mock(PostRepositoryPort.class);
        PostLikeRepositoryPort likeRepository = mock(PostLikeRepositoryPort.class);
        FriendClientPort friendClient = mock(FriendClientPort.class);
        FeedCachePort feedCache = mock(FeedCachePort.class);
        PostCachePort postCache = mock(PostCachePort.class);
        FeedService service = new FeedService(postRepository, likeRepository, friendClient, feedCache, postCache);

        UUID viewerId = UUID.randomUUID();
        Post cachedPost = post(UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"), "cached", "2026-01-20T12:02:00Z");
        Post missingPost = post(UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"), "fetched", "2026-01-20T12:01:00Z");
        List<UUID> ids = List.of(cachedPost.id(), missingPost.id());

        when(feedCache.fetchFeed(viewerId, "", 10)).thenReturn(new FeedCachePage(ids, "1710000000000|" + missingPost.id()));
        when(postCache.fetchPosts(ids)).thenReturn(Map.of(cachedPost.id(), cachedPost));
        when(postRepository.fetchByIds(List.of(missingPost.id()))).thenReturn(List.of(missingPost));
        when(likeRepository.countLikes(ids)).thenReturn(Map.of());
        when(likeRepository.findLikedPostIds(viewerId, ids)).thenReturn(Set.of());

        FeedView view = service.loadFeed(viewerId, "", 10);

        assertEquals(2, view.posts().size());
        assertEquals(cachedPost.id(), view.posts().get(0).id());
        assertEquals(missingPost.id(), view.posts().get(1).id());
        verify(postRepository).fetchByIds(List.of(missingPost.id()));
        verify(postCache).storeAll(List.of(missingPost));
    }

    @Test
    void loadFeedOnCacheMissFetchesFromFollowingAndPopulatesCaches() {
        PostRepositoryPort postRepository = mock(PostRepositoryPort.class);
        PostLikeRepositoryPort likeRepository = mock(PostLikeRepositoryPort.class);
        FriendClientPort friendClient = mock(FriendClientPort.class);
        FeedCachePort feedCache = mock(FeedCachePort.class);
        PostCachePort postCache = mock(PostCachePort.class);
        FeedService service = new FeedService(postRepository, likeRepository, friendClient, feedCache, postCache);

        UUID viewerId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();
        Post fresh = post(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), "fresh", "2026-01-20T12:03:00Z");

        when(feedCache.fetchFeed(viewerId, null, 5)).thenReturn(new FeedCachePage(List.of(), null));
        when(friendClient.fetchFollowingIds(viewerId)).thenReturn(List.of(friendId));
        when(postRepository.fetchFeed(List.of(friendId, viewerId), null, 5))
                .thenReturn(new FeedPage(List.of(fresh), null));
        when(likeRepository.countLikes(List.of(fresh.id()))).thenReturn(Map.of(fresh.id(), 3L));
        when(likeRepository.findLikedPostIds(viewerId, List.of(fresh.id()))).thenReturn(Set.of(fresh.id()));

        FeedView view = service.loadFeed(viewerId, null, 5);

        assertEquals(1, view.posts().size());
        assertEquals(3L, view.posts().get(0).likeCount());
        verify(postCache).storeAll(List.of(fresh));
        verify(feedCache).pushToFeed(viewerId, List.of(fresh));
    }

    @Test
    void loadByAuthorSearchAndTrendingStorePostsInCache() {
        PostRepositoryPort postRepository = mock(PostRepositoryPort.class);
        PostLikeRepositoryPort likeRepository = mock(PostLikeRepositoryPort.class);
        FriendClientPort friendClient = mock(FriendClientPort.class);
        FeedCachePort feedCache = mock(FeedCachePort.class);
        PostCachePort postCache = mock(PostCachePort.class);
        FeedService service = new FeedService(postRepository, likeRepository, friendClient, feedCache, postCache);

        UUID authorId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        Post p1 = post(UUID.fromString("ffffffff-ffff-ffff-ffff-fffffffffff1"), "a", "2026-01-20T12:00:00Z");
        Post p2 = post(UUID.fromString("ffffffff-ffff-ffff-ffff-fffffffffff2"), "b", "2026-01-20T11:59:00Z");

        when(postRepository.fetchByAuthor(authorId, null, 10)).thenReturn(new FeedPage(List.of(p1), null));
        when(postRepository.searchByContent("keyword", null, 10)).thenReturn(new FeedPage(List.of(p2), null));
        when(postRepository.fetchTrending(null, 10)).thenReturn(new FeedPage(List.of(p1, p2), null));
        when(likeRepository.countLikes(anyList())).thenReturn(Map.of());
        when(likeRepository.findLikedPostIds(eq(viewerId), any())).thenReturn(Set.of());

        service.loadByAuthor(authorId, viewerId, null, 10);
        service.search(viewerId, "keyword", null, 10);
        service.loadTrending(viewerId, null, 10);

        verify(postCache).storeAll(List.of(p1));
        verify(postCache).storeAll(List.of(p2));
        verify(postCache).storeAll(List.of(p1, p2));
    }

    private static Post post(UUID id, String content, String createdAt) {
        return new Post(id, UUID.randomUUID(), content, "PUBLIC", Instant.parse(createdAt), 0L);
    }
}
