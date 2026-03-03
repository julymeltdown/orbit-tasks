package com.example.post.adapters.out.redis;

import java.util.List;
import java.util.Map;
import java.util.Set;
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
class RedisPostLikeRepositoryTest {
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
    void likeIsIdempotentAndCountsStayConsistent() {
        RedisPostLikeRepository repository = new RedisPostLikeRepository(redisTemplate);

        UUID postId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        assertTrue(repository.addLike(postId, userId));
        assertFalse(repository.addLike(postId, userId));
        assertEquals(1, repository.countLikes(postId));

        assertTrue(repository.removeLike(postId, userId));
        assertFalse(repository.removeLike(postId, userId));
        assertEquals(0, repository.countLikes(postId));
    }

    @Test
    void findsLikedPostIdsForViewer() {
        RedisPostLikeRepository repository = new RedisPostLikeRepository(redisTemplate);

        UUID viewerId = UUID.randomUUID();
        UUID postA = UUID.randomUUID();
        UUID postB = UUID.randomUUID();
        UUID postC = UUID.randomUUID();

        repository.addLike(postA, viewerId);
        repository.addLike(postC, viewerId);

        Set<UUID> liked = repository.findLikedPostIds(viewerId, List.of(postA, postB, postC));
        assertEquals(Set.of(postA, postC), liked);

        Map<UUID, Long> counts = repository.countLikes(List.of(postA, postB, postC));
        assertEquals(1L, counts.get(postA));
        assertEquals(0L, counts.get(postB));
        assertEquals(1L, counts.get(postC));
    }
}
