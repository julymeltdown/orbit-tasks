package com.example.post.application.port.out;

import com.example.post.domain.FeedCachePage;
import com.example.post.domain.Post;
import java.util.List;
import java.util.UUID;

public interface FeedCachePort {
    FeedCachePage fetchFeed(UUID userId, String cursor, int limit);

    void pushToFeed(UUID userId, Post post);

    void pushToFeed(UUID userId, List<Post> posts);

    void pushToFeeds(List<UUID> userIds, Post post);

    void clear(UUID userId);
}
