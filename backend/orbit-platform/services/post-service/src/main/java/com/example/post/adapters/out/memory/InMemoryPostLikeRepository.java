package com.example.post.adapters.out.memory;

import com.example.post.application.port.out.PostLikeRepositoryPort;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;
import java.util.stream.Collectors;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "test"})
@ConditionalOnProperty(name = "post.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryPostLikeRepository implements PostLikeRepositoryPort {
    private final Map<UUID, Set<UUID>> likesByPost = new ConcurrentHashMap<>();
    private final Map<UUID, LongAdder> likeCounts = new ConcurrentHashMap<>();

    @Override
    public boolean addLike(UUID postId, UUID userId) {
        if (postId == null || userId == null) {
            return false;
        }
        Set<UUID> likes = likesByPost.computeIfAbsent(postId, id -> ConcurrentHashMap.newKeySet());
        boolean added = likes.add(userId);
        if (added) {
            likeCounts.computeIfAbsent(postId, id -> new LongAdder()).increment();
        }
        return added;
    }

    @Override
    public boolean removeLike(UUID postId, UUID userId) {
        if (postId == null || userId == null) {
            return false;
        }
        Set<UUID> likes = likesByPost.get(postId);
        if (likes == null) {
            return false;
        }
        boolean removed = likes.remove(userId);
        if (removed) {
            likeCounts.computeIfAbsent(postId, id -> new LongAdder()).add(-1L);
        }
        return removed;
    }

    @Override
    public long countLikes(UUID postId) {
        LongAdder adder = likeCounts.get(postId);
        return adder == null ? 0L : adder.longValue();
    }

    @Override
    public Map<UUID, Long> countLikes(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return postIds.stream().distinct().collect(Collectors.toMap(id -> id, this::countLikes));
    }

    @Override
    public Set<UUID> findLikedPostIds(UUID userId, List<UUID> postIds) {
        if (userId == null || postIds == null || postIds.isEmpty()) {
            return Collections.emptySet();
        }
        return postIds.stream()
                .filter(postId -> {
                    Set<UUID> likes = likesByPost.get(postId);
                    return likes != null && likes.contains(userId);
                })
                .collect(Collectors.toSet());
    }

    @Override
    public void clear() {
        likesByPost.clear();
        likeCounts.clear();
    }
}
