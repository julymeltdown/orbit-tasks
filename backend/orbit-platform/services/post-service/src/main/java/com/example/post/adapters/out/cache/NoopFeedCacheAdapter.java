package com.example.post.adapters.out.cache;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.domain.FeedCachePage;
import com.example.post.domain.Post;
import java.util.List;
import java.util.UUID;

public class NoopFeedCacheAdapter implements FeedCachePort {
    @Override
    public FeedCachePage fetchFeed(UUID userId, String cursor, int limit) {
        return new FeedCachePage(List.of(), null);
    }

    @Override
    public void pushToFeed(UUID userId, Post post) {
    }

    @Override
    public void pushToFeed(UUID userId, List<Post> posts) {
    }

    @Override
    public void pushToFeeds(List<UUID> userIds, Post post) {
    }

    @Override
    public void clear(UUID userId) {
    }
}
