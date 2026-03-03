package com.example.post.adapters.out.redis;

import com.example.post.application.port.out.PostCachePort;
import com.example.post.domain.Post;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.ScanOptions;

public class RedisPostCacheAdapter implements PostCachePort {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;
    private final String keyPrefix;

    public RedisPostCacheAdapter(StringRedisTemplate redisTemplate,
                                 ObjectMapper objectMapper,
                                 @Value("${post.redis.post.ttl:PT12H}") Duration ttl,
                                 @Value("${post.redis.post.key-prefix:post:cache:}") String keyPrefix) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = ttl;
        this.keyPrefix = keyPrefix;
    }

    @Override
    public Map<UUID, Post> fetchPosts(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> keys = new ArrayList<>();
        for (UUID id : postIds) {
            if (id != null) {
                keys.add(cacheKey(id));
            }
        }
        if (keys.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> values = redisTemplate.opsForValue().multiGet(keys);
        if (values == null || values.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, Post> results = new HashMap<>();
        for (int index = 0; index < values.size(); index++) {
            String value = values.get(index);
            if (value == null) {
                continue;
            }
            try {
                Post post = objectMapper.readValue(value, Post.class);
                results.put(post.id(), post);
            } catch (JacksonException ex) {
                // ignore invalid payloads
            }
        }
        return results;
    }

    @Override
    public void store(Post post) {
        if (post == null) {
            return;
        }
        try {
            String key = cacheKey(post.id());
            String payload = objectMapper.writeValueAsString(post);
            if (ttl != null && !ttl.isZero() && !ttl.isNegative()) {
                redisTemplate.opsForValue().set(key, payload, ttl);
            } else {
                redisTemplate.opsForValue().set(key, payload);
            }
        } catch (JacksonException ex) {
            // ignore serialization failures
        }
    }

    @Override
    public void storeAll(List<Post> posts) {
        if (posts == null || posts.isEmpty()) {
            return;
        }
        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (Post post : posts) {
                if (post == null) {
                    continue;
                }
                try {
                    String key = cacheKey(post.id());
                    String payload = objectMapper.writeValueAsString(post);
                    byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
                    byte[] valueBytes = payload.getBytes(StandardCharsets.UTF_8);
                    if (ttl != null && !ttl.isZero() && !ttl.isNegative()) {
                        connection.setEx(keyBytes, ttl.getSeconds(), valueBytes);
                    } else {
                        connection.set(keyBytes, valueBytes);
                    }
                } catch (JacksonException ex) {
                    // ignore serialization failures
                }
            }
            return null;
        });
    }

    @Override
    public void evict(UUID postId) {
        if (postId == null) {
            return;
        }
        redisTemplate.delete(cacheKey(postId));
    }

    @Override
    public void clear() {
        redisTemplate.execute((RedisCallback<Void>) connection -> {
            try (var cursor = connection.scan(ScanOptions.scanOptions().match(keyPrefix + "*").count(500).build())) {
                List<byte[]> keys = new ArrayList<>();
                cursor.forEachRemaining(keys::add);
                if (!keys.isEmpty()) {
                    connection.del(keys.toArray(new byte[0][]));
                }
            }
            return null;
        });
    }

    private String cacheKey(UUID postId) {
        return keyPrefix + postId;
    }
}
