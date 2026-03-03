package com.example.post.application.port.out;

import com.example.post.domain.Post;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface PostCachePort {
    Map<UUID, Post> fetchPosts(List<UUID> postIds);

    void store(Post post);

    void storeAll(List<Post> posts);

    void evict(UUID postId);

    void clear();
}
