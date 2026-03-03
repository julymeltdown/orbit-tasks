package com.example.post.application.port.out;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface PostLikeRepositoryPort {
    boolean addLike(UUID postId, UUID userId);

    boolean removeLike(UUID postId, UUID userId);

    long countLikes(UUID postId);

    Map<UUID, Long> countLikes(List<UUID> postIds);

    Set<UUID> findLikedPostIds(UUID userId, List<UUID> postIds);

    void clear();
}
