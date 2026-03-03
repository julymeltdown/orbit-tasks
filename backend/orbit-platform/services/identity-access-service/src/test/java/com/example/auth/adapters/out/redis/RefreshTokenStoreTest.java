package com.example.auth.adapters.out.redis;

import com.example.auth.application.port.out.RefreshTokenRecord;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
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

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class RefreshTokenStoreTest {
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
    void storesAndFindsRefreshTokenRecord() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        RefreshTokenStore store = new RefreshTokenStore(redisTemplate, new RedisScripts(), clock);

        UUID userId = UUID.randomUUID();
        RefreshTokenRecord record = new RefreshTokenRecord(
                "jti-1",
                "hash-1",
                userId,
                now.plus(Duration.ofMinutes(10)));

        store.store(record);

        Optional<RefreshTokenRecord> loaded = store.find("jti-1");
        assertThat(loaded).contains(record);

        Long ttlSeconds = redisTemplate.getExpire("auth:refresh:jti-1");
        assertThat(ttlSeconds).isNotNull();
        assertThat(ttlSeconds).isGreaterThan(0);
    }

    @Test
    void rotatesRefreshTokenAndMarksOldJtiAsUsed() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        RefreshTokenStore store = new RefreshTokenStore(redisTemplate, new RedisScripts(), clock);

        UUID userId = UUID.randomUUID();
        RefreshTokenRecord current = new RefreshTokenRecord(
                "jti-current",
                "hash-current",
                userId,
                now.plus(Duration.ofMinutes(10)));
        store.store(current);

        RefreshTokenRecord next = new RefreshTokenRecord(
                "jti-next",
                "hash-next",
                userId,
                now.plus(Duration.ofMinutes(10)));

        boolean rotated = store.rotate(current.jti(), current.tokenHash(), next);
        assertThat(rotated).isTrue();

        assertThat(store.find(current.jti())).isEmpty();
        assertThat(store.find(next.jti())).contains(next);
        assertThat(store.isUsed(current.jti())).isTrue();
    }

    @Test
    void rotateFailsWhenTokenHashDoesNotMatch() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        RefreshTokenStore store = new RefreshTokenStore(redisTemplate, new RedisScripts(), clock);

        UUID userId = UUID.randomUUID();
        RefreshTokenRecord current = new RefreshTokenRecord(
                "jti-current",
                "hash-current",
                userId,
                now.plus(Duration.ofMinutes(10)));
        store.store(current);

        RefreshTokenRecord next = new RefreshTokenRecord(
                "jti-next",
                "hash-next",
                userId,
                now.plus(Duration.ofMinutes(10)));

        boolean rotated = store.rotate(current.jti(), "wrong-hash", next);
        assertThat(rotated).isFalse();
        assertThat(store.find(current.jti())).contains(current);
        assertThat(store.find(next.jti())).isEmpty();
        assertThat(store.isUsed(current.jti())).isFalse();
    }

    @Test
    void revokeDeletesRefreshTokenAndUsedMarker() {
        Instant now = Instant.parse("2026-01-20T00:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        RefreshTokenStore store = new RefreshTokenStore(redisTemplate, new RedisScripts(), clock);

        UUID userId = UUID.randomUUID();
        RefreshTokenRecord record = new RefreshTokenRecord(
                "jti-1",
                "hash-1",
                userId,
                now.plus(Duration.ofMinutes(10)));
        store.store(record);

        RefreshTokenRecord next = new RefreshTokenRecord(
                "jti-2",
                "hash-2",
                userId,
                now.plus(Duration.ofMinutes(10)));
        store.rotate(record.jti(), record.tokenHash(), next);
        assertThat(store.isUsed(record.jti())).isTrue();

        store.revoke(record.jti());
        store.revoke(next.jti());

        assertThat(store.find(record.jti())).isEmpty();
        assertThat(store.find(next.jti())).isEmpty();
        assertThat(store.isUsed(record.jti())).isFalse();
    }
}
