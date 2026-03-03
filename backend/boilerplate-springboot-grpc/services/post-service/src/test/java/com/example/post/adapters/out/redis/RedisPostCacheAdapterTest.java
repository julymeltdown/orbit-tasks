package com.example.post.adapters.out.redis;

import com.example.post.domain.Post;
import tools.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class RedisPostCacheAdapterTest {
    @Container
    private static final GenericContainer<?> redis = new GenericContainer<>(
            DockerImageName.parse("redis:7.2.4"))
            .withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setUp() {
        connectionFactory = new LettuceConnectionFactory(redis.getHost(), redis.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        redisTemplate = new StringRedisTemplate(connectionFactory);
        redisTemplate.afterPropertiesSet();
    }

    @AfterEach
    void tearDown() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        connectionFactory.destroy();
    }

    @Test
    void storesAndFetchesPosts() {
        RedisPostCacheAdapter adapter = new RedisPostCacheAdapter(
                redisTemplate,
                new ObjectMapper(),
                Duration.ofHours(1),
                "test:post:"
        );

        Post first = new Post(UUID.randomUUID(), UUID.randomUUID(), "Hello", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 1);
        Post second = new Post(UUID.randomUUID(), UUID.randomUUID(), "World", "PUBLIC", Instant.parse("2026-01-20T10:05:00Z"), 0);

        adapter.storeAll(List.of(first, second));

        Map<UUID, Post> cached = adapter.fetchPosts(List.of(first.id(), second.id()));
        assertEquals(2, cached.size());
        assertTrue(cached.containsKey(first.id()));
        assertEquals("World", cached.get(second.id()).content());
    }

    @Test
    void evictAndClearRemoveCachedEntries() {
        RedisPostCacheAdapter adapter = new RedisPostCacheAdapter(
                redisTemplate,
                new ObjectMapper(),
                Duration.ofHours(1),
                "test:post:"
        );

        Post first = new Post(UUID.randomUUID(), UUID.randomUUID(), "A", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);
        Post second = new Post(UUID.randomUUID(), UUID.randomUUID(), "B", "PUBLIC", Instant.parse("2026-01-20T10:05:00Z"), 0);
        adapter.storeAll(List.of(first, second));

        adapter.evict(first.id());
        Map<UUID, Post> afterEvict = adapter.fetchPosts(List.of(first.id(), second.id()));
        assertFalse(afterEvict.containsKey(first.id()));
        assertTrue(afterEvict.containsKey(second.id()));

        adapter.clear();
        Map<UUID, Post> afterClear = adapter.fetchPosts(List.of(second.id()));
        assertTrue(afterClear.isEmpty());
    }

    @Test
    void handlesEmptyInputsAndInvalidPayloadGracefully() {
        RedisPostCacheAdapter adapter = new RedisPostCacheAdapter(
                redisTemplate,
                new ObjectMapper(),
                Duration.ofHours(1),
                "test:post:"
        );
        assertTrue(adapter.fetchPosts(List.of()).isEmpty());
        adapter.store(null);
        adapter.storeAll(List.of());

        UUID brokenId = UUID.randomUUID();
        redisTemplate.opsForValue().set("test:post:" + brokenId, "{bad-json");
        Map<UUID, Post> fetched = adapter.fetchPosts(List.of(brokenId));
        assertTrue(fetched.isEmpty());
    }
}
