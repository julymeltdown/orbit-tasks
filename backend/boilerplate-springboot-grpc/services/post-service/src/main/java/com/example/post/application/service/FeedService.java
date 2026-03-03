package com.example.post.application.service;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.port.out.PostCachePort;
import com.example.post.application.port.out.PostLikeRepositoryPort;
import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.domain.FeedCachePage;
import com.example.post.domain.FeedPage;
import com.example.post.domain.FeedView;
import com.example.post.domain.Post;
import com.example.post.domain.PostCursor;
import com.example.post.domain.PostView;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class FeedService {
    private final PostRepositoryPort postRepository;
    private final PostLikeRepositoryPort likeRepository;
    private final FriendClientPort friendClient;
    private final FeedCachePort feedCache;
    private final PostCachePort postCache;

    public FeedService(PostRepositoryPort postRepository,
                       PostLikeRepositoryPort likeRepository,
                       FriendClientPort friendClient,
                       FeedCachePort feedCache,
                       PostCachePort postCache) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.friendClient = friendClient;
        this.feedCache = feedCache;
        this.postCache = postCache;
    }

    public FeedView loadFeed(UUID userId, String cursor, int limit) {
        FeedCachePage cached = feedCache.fetchFeed(userId, cursor, limit);
        if (cached != null && !cached.postIds().isEmpty()) {
            List<Post> cachedPosts = resolvePosts(cached.postIds());
            String nextCursor = toPostCursor(cachedPosts, cached.nextCursor());
            return toView(new FeedPage(cachedPosts, nextCursor), userId);
        }
        List<UUID> followingIds = friendClient.fetchFollowingIds(userId);
        List<UUID> authorIds = new ArrayList<>(followingIds);
        authorIds.add(userId);
        FeedPage page = postRepository.fetchFeed(authorIds, cursor, limit);
        postCache.storeAll(page.posts());
        feedCache.pushToFeed(userId, page.posts());
        return toView(page, userId);
    }

    public FeedView loadByAuthor(UUID authorId, UUID viewerId, String cursor, int limit) {
        FeedPage page = postRepository.fetchByAuthor(authorId, cursor, limit);
        postCache.storeAll(page.posts());
        return toView(page, viewerId);
    }

    public FeedView search(UUID viewerId, String query, String cursor, int limit) {
        FeedPage page = postRepository.searchByContent(query, cursor, limit);
        postCache.storeAll(page.posts());
        return toView(page, viewerId);
    }

    public FeedView loadTrending(UUID viewerId, String cursor, int limit) {
        FeedPage page = postRepository.fetchTrending(cursor, limit);
        postCache.storeAll(page.posts());
        return toView(page, viewerId);
    }

    private FeedView toView(FeedPage page, UUID viewerId) {
        List<Post> posts = page.posts();
        List<UUID> postIds = posts.stream().map(Post::id).toList();
        Map<UUID, Long> likeCounts = likeRepository.countLikes(postIds);
        Set<UUID> likedIds = likeRepository.findLikedPostIds(viewerId, postIds);
        List<PostView> views = posts.stream()
                .map(post -> toView(post, likeCounts, likedIds))
                .toList();
        return new FeedView(views, page.nextCursor());
    }

    private List<Post> resolvePosts(List<UUID> postIds) {
        Map<UUID, Post> cached = new HashMap<>(postCache.fetchPosts(postIds));
        List<UUID> missingIds = postIds.stream()
                .filter(id -> !cached.containsKey(id))
                .toList();
        if (!missingIds.isEmpty()) {
            List<Post> fetched = postRepository.fetchByIds(missingIds);
            postCache.storeAll(fetched);
            for (Post post : fetched) {
                cached.put(post.id(), post);
            }
        }
        List<Post> ordered = new ArrayList<>();
        for (UUID id : postIds) {
            Post post = cached.get(id);
            if (post != null) {
                ordered.add(post);
            }
        }
        return ordered;
    }

    private PostView toView(Post post, Map<UUID, Long> likeCounts, Set<UUID> likedIds) {
        long likeCount = likeCounts.getOrDefault(post.id(), 0L);
        boolean likedByViewer = likedIds.contains(post.id());
        return new PostView(
                post.id(),
                post.authorId(),
                post.content(),
                post.visibility(),
                post.createdAt(),
                post.commentCount(),
                likeCount,
                likedByViewer
        );
    }

    private String toPostCursor(List<Post> posts, String rawNextCursor) {
        if (rawNextCursor == null || rawNextCursor.isBlank() || posts.isEmpty()) {
            return null;
        }
        Post last = posts.get(posts.size() - 1);
        return PostCursor.from(last).encode();
    }
}
