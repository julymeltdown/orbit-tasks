package com.example.post.adapters.out.cache;

import com.example.post.application.port.out.PostCachePort;
import com.example.post.domain.Post;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class NoopPostCacheAdapter implements PostCachePort {
    @Override
    public Map<UUID, Post> fetchPosts(List<UUID> postIds) {
        return Collections.emptyMap();
    }

    @Override
    public void store(Post post) {
    }

    @Override
    public void storeAll(List<Post> posts) {
    }

    @Override
    public void evict(UUID postId) {
    }

    @Override
    public void clear() {
    }
}
