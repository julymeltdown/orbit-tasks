package com.example.auth.adapters.out.redis;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class RedisMaintenanceJob {
    private static final Logger logger = LoggerFactory.getLogger(RedisMaintenanceJob.class);

    private final StringRedisTemplate redisTemplate;
    private final long scanCount;
    private final Duration throttle;

    public RedisMaintenanceJob(StringRedisTemplate redisTemplate,
                               @Value("${auth.redis.scan-count:1000}") long scanCount,
                               @Value("${auth.redis.scan-throttle:PT0.05S}") Duration throttle) {
        this.redisTemplate = redisTemplate;
        this.scanCount = scanCount;
        this.throttle = throttle;
    }

    @Scheduled(fixedDelayString = "${auth.redis.scan-interval:PT5M}")
    public void scanKeys() {
        ScanOptions options = ScanOptions.scanOptions()
                .match("auth:*")
                .count(scanCount)
                .build();
        redisTemplate.execute((RedisCallback<Void>) connection -> {
            long scanned = 0L;
            try (Cursor<byte[]> cursor = connection.scan(options)) {
                while (cursor.hasNext()) {
                    byte[] key = cursor.next();
                    scanned++;
                    if (throttle.toMillis() > 0 && scanned % scanCount == 0) {
                        sleepQuietly();
                    }
                    if (key.length == 0) {
                        continue;
                    }
                }
            }
            if (scanned > 0) {
                logger.info("Redis maintenance scan completed: {} keys", scanned);
            }
            return null;
        });
    }

    private void sleepQuietly() {
        try {
            Thread.sleep(throttle.toMillis());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
