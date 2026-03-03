package com.example.auth.adapters.out.redis;

import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenStore implements RefreshTokenStorePort {
    private static final String REFRESH_PREFIX = "auth:refresh:";
    private static final String USED_PREFIX = "auth:refresh:used:";

    private final StringRedisTemplate redisTemplate;
    private final RedisScripts redisScripts;
    private final Clock clock;

    public RefreshTokenStore(StringRedisTemplate redisTemplate, RedisScripts redisScripts) {
        this(redisTemplate, redisScripts, Clock.systemUTC());
    }

    @Autowired
    public RefreshTokenStore(StringRedisTemplate redisTemplate, RedisScripts redisScripts, Clock clock) {
        this.redisTemplate = redisTemplate;
        this.redisScripts = redisScripts;
        this.clock = clock;
    }

    @Override
    public void store(RefreshTokenRecord record) {
        String key = refreshKey(record.jti());
        redisTemplate.opsForHash().put(key, "user_id", record.userId().toString());
        redisTemplate.opsForHash().put(key, "token_hash", record.tokenHash());
        redisTemplate.opsForHash().put(key, "expires_at", record.expiresAt().toString());
        redisTemplate.opsForHash().put(key, "revoked", "false");
        Duration ttl = Duration.between(clock.instant(), record.expiresAt());
        if (!ttl.isNegative()) {
            redisTemplate.expire(key, ttl);
        }
    }

    @Override
    public Optional<RefreshTokenRecord> find(String jti) {
        String key = refreshKey(jti);
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        if (entries.isEmpty()) {
            return Optional.empty();
        }
        String userId = (String) entries.get("user_id");
        String tokenHash = (String) entries.get("token_hash");
        String expiresAt = (String) entries.get("expires_at");
        if (userId == null || tokenHash == null || expiresAt == null) {
            return Optional.empty();
        }
        return Optional.of(new RefreshTokenRecord(jti, tokenHash, UUID.fromString(userId), Instant.parse(expiresAt)));
    }

    @Override
    public boolean rotate(String currentJti, String currentTokenHash, RefreshTokenRecord nextRecord) {
        String currentKey = refreshKey(currentJti);
        String usedKey = usedKey(currentJti);
        String nextKey = refreshKey(nextRecord.jti());
        long ttlSeconds = Duration.between(clock.instant(), nextRecord.expiresAt()).getSeconds();
        DefaultRedisScript<Long> script = redisScripts.refreshRotateScript();
        Long result = redisTemplate.execute(
                script,
                List.of(currentKey, usedKey, nextKey),
                currentTokenHash,
                nextRecord.userId().toString(),
                nextRecord.tokenHash(),
                nextRecord.expiresAt().toString(),
                String.valueOf(Math.max(ttlSeconds, 1)));
        return result != null && result == 1L;
    }

    @Override
    public void revoke(String jti) {
        redisTemplate.delete(refreshKey(jti));
        redisTemplate.delete(usedKey(jti));
    }

    @Override
    public boolean isUsed(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(usedKey(jti)));
    }

    private String refreshKey(String jti) {
        return REFRESH_PREFIX + jti;
    }

    private String usedKey(String jti) {
        return USED_PREFIX + jti;
    }
}
