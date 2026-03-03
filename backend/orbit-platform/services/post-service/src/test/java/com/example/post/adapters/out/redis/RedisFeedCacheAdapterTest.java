package com.example.post.adapters.out.redis;

import com.example.post.domain.FeedCachePage;
import com.example.post.domain.Post;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class RedisFeedCacheAdapterTest {
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
    void fetchFeedUsesCursorForPagination() {
        Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);
        RedisFeedCacheAdapter adapter = new RedisFeedCacheAdapter(redisTemplate, clock, 10, Duration.ofHours(1), "test:feed:");

        UUID userId = UUID.randomUUID();
        Post oldest = new Post(UUID.randomUUID(), userId, "old", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);
        Post newer = new Post(UUID.randomUUID(), userId, "newer", "PUBLIC", Instant.parse("2026-01-20T10:01:00Z"), 0);
        Post newest = new Post(UUID.randomUUID(), userId, "newest", "PUBLIC", Instant.parse("2026-01-20T10:02:00Z"), 0);

        adapter.pushToFeed(userId, oldest);
        adapter.pushToFeed(userId, newer);
        adapter.pushToFeed(userId, newest);

        FeedCachePage firstPage = adapter.fetchFeed(userId, null, 2);
        assertEquals(List.of(newest.id(), newer.id()), firstPage.postIds());
        assertNotNull(firstPage.nextCursor());

        FeedCachePage secondPage = adapter.fetchFeed(userId, firstPage.nextCursor(), 2);
        assertEquals(List.of(oldest.id()), secondPage.postIds());
        assertNull(secondPage.nextCursor());
    }

    @Test
    void trimsFeedToMaxSize() {
        Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);
        RedisFeedCacheAdapter adapter = new RedisFeedCacheAdapter(redisTemplate, clock, 3, Duration.ofHours(1), "test:feed:");

        UUID userId = UUID.randomUUID();
        Post first = new Post(UUID.randomUUID(), userId, "one", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);
        Post second = new Post(UUID.randomUUID(), userId, "two", "PUBLIC", Instant.parse("2026-01-20T10:01:00Z"), 0);
        Post third = new Post(UUID.randomUUID(), userId, "three", "PUBLIC", Instant.parse("2026-01-20T10:02:00Z"), 0);
        Post fourth = new Post(UUID.randomUUID(), userId, "four", "PUBLIC", Instant.parse("2026-01-20T10:03:00Z"), 0);

        adapter.pushToFeed(userId, first);
        adapter.pushToFeed(userId, second);
        adapter.pushToFeed(userId, third);
        adapter.pushToFeed(userId, fourth);

        FeedCachePage page = adapter.fetchFeed(userId, null, 10);
        assertEquals(3, page.postIds().size());
        assertEquals(List.of(fourth.id(), third.id(), second.id()), page.postIds());
    }

    @Test
    void supportsCompositeCursorFromApiLayer() {
        Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);
        RedisFeedCacheAdapter adapter = new RedisFeedCacheAdapter(redisTemplate, clock, 10, Duration.ofHours(1), "test:feed:");

        UUID userId = UUID.randomUUID();
        Post oldest = new Post(UUID.randomUUID(), userId, "old", "PUBLIC", Instant.parse("2026-01-20T10:00:00Z"), 0);
        Post middle = new Post(UUID.randomUUID(), userId, "middle", "PUBLIC", Instant.parse("2026-01-20T10:01:00Z"), 0);
        Post newest = new Post(UUID.randomUUID(), userId, "newest", "PUBLIC", Instant.parse("2026-01-20T10:02:00Z"), 0);

        adapter.pushToFeed(userId, oldest);
        adapter.pushToFeed(userId, middle);
        adapter.pushToFeed(userId, newest);

        String compositeCursor = "2026-01-20T10:01:00Z|" + middle.id();
        FeedCachePage secondPage = adapter.fetchFeed(userId, compositeCursor, 2);

        assertEquals(List.of(oldest.id()), secondPage.postIds());
        assertNull(secondPage.nextCursor());
    }

    @Test
    void handlesNullUserAndInvalidCursorGracefully() {
        Clock clock = Clock.fixed(Instant.parse("2026-01-20T10:00:00Z"), ZoneOffset.UTC);
        RedisFeedCacheAdapter adapter = new RedisFeedCacheAdapter(redisTemplate, clock, 10, Duration.ofHours(1), "test:feed:");

        FeedCachePage nullUserPage = adapter.fetchFeed(null, null, 5);
        FeedCachePage invalidCursorPage = adapter.fetchFeed(UUID.randomUUID(), "not-a-cursor", 5);
        adapter.pushToFeed(null, (Post) null);
        adapter.pushToFeed(UUID.randomUUID(), List.of());
        adapter.pushToFeeds(List.of(), new Post(UUID.randomUUID(), UUID.randomUUID(), "x", "PUBLIC", Instant.now(), 0));
        adapter.clear(null);

        assertTrue(nullUserPage.postIds().isEmpty());
        assertNull(nullUserPage.nextCursor());
        assertTrue(invalidCursorPage.postIds().isEmpty());
    }
}
