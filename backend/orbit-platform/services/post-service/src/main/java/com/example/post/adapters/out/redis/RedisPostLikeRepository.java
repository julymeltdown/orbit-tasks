package com.example.post.adapters.out.redis;

import com.example.post.application.port.out.PostLikeRepositoryPort;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.ScanOptions;

public class RedisPostLikeRepository implements PostLikeRepositoryPort {
    private static final String POST_LIKES_PREFIX = "post:likes:";
    private static final String USER_LIKES_PREFIX = "user:likes:";
    private static final String LIKE_COUNT_PREFIX = "post:like_count:";

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> addLikeScript;
    private final DefaultRedisScript<Long> removeLikeScript;

    public RedisPostLikeRepository(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.addLikeScript = new DefaultRedisScript<>(
                "if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 1 then return 0 end "
                        + "redis.call('SADD', KEYS[1], ARGV[1]) "
                        + "redis.call('SADD', KEYS[2], ARGV[2]) "
                        + "redis.call('INCR', KEYS[3]) "
                        + "return 1",
                Long.class
        );
        this.removeLikeScript = new DefaultRedisScript<>(
                "if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 0 then return 0 end "
                        + "redis.call('SREM', KEYS[1], ARGV[1]) "
                        + "redis.call('SREM', KEYS[2], ARGV[2]) "
                        + "local count = redis.call('DECR', KEYS[3]) "
                        + "if count < 0 then redis.call('SET', KEYS[3], 0) end "
                        + "return 1",
                Long.class
        );
    }

    @Override
    public boolean addLike(UUID postId, UUID userId) {
        if (postId == null || userId == null) {
            return false;
        }
        List<String> keys = List.of(postLikesKey(postId), userLikesKey(userId), likeCountKey(postId));
        Long result = redisTemplate.execute(addLikeScript, keys, userId.toString(), postId.toString());
        return result != null && result > 0;
    }

    @Override
    public boolean removeLike(UUID postId, UUID userId) {
        if (postId == null || userId == null) {
            return false;
        }
        List<String> keys = List.of(postLikesKey(postId), userLikesKey(userId), likeCountKey(postId));
        Long result = redisTemplate.execute(removeLikeScript, keys, userId.toString(), postId.toString());
        return result != null && result > 0;
    }

    @Override
    public long countLikes(UUID postId) {
        if (postId == null) {
            return 0L;
        }
        String value = redisTemplate.opsForValue().get(likeCountKey(postId));
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    @Override
    public Map<UUID, Long> countLikes(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> keys = new ArrayList<>();
        List<UUID> ids = new ArrayList<>();
        for (UUID postId : postIds) {
            if (postId != null) {
                ids.add(postId);
                keys.add(likeCountKey(postId));
            }
        }
        if (keys.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> values = redisTemplate.opsForValue().multiGet(keys);
        Map<UUID, Long> result = new HashMap<>();
        if (values == null) {
            return result;
        }
        for (int index = 0; index < values.size(); index++) {
            String value = values.get(index);
            long count = 0L;
            if (value != null) {
                try {
                    count = Long.parseLong(value);
                } catch (NumberFormatException ex) {
                    count = 0L;
                }
            }
            result.put(ids.get(index), count);
        }
        return result;
    }

    @Override
    public Set<UUID> findLikedPostIds(UUID userId, List<UUID> postIds) {
        if (userId == null || postIds == null || postIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<UUID> ids = postIds.stream().filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return Collections.emptySet();
        }
        String key = userLikesKey(userId);
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            for (UUID postId : ids) {
                connection.sIsMember(keyBytes, postId.toString().getBytes(StandardCharsets.UTF_8));
            }
            return null;
        });
        Set<UUID> liked = new HashSet<>();
        for (int index = 0; index < results.size(); index++) {
            Object raw = results.get(index);
            if (raw instanceof Boolean && (Boolean) raw) {
                liked.add(ids.get(index));
            }
        }
        return liked;
    }

    @Override
    public void clear() {
        deleteByPrefix(POST_LIKES_PREFIX);
        deleteByPrefix(USER_LIKES_PREFIX);
        deleteByPrefix(LIKE_COUNT_PREFIX);
    }

    private void deleteByPrefix(String prefix) {
        redisTemplate.execute((RedisCallback<Void>) connection -> {
            try (var cursor = connection.scan(ScanOptions.scanOptions().match(prefix + "*").count(500).build())) {
                List<byte[]> keys = new ArrayList<>();
                cursor.forEachRemaining(keys::add);
                if (!keys.isEmpty()) {
                    connection.del(keys.toArray(new byte[0][]));
                }
            }
            return null;
        });
    }

    private String postLikesKey(UUID postId) {
        return POST_LIKES_PREFIX + postId;
    }

    private String userLikesKey(UUID userId) {
        return USER_LIKES_PREFIX + userId;
    }

    private String likeCountKey(UUID postId) {
        return LIKE_COUNT_PREFIX + postId;
    }
}
