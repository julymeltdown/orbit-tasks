package com.example.post.adapters.out.redis;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.domain.FeedCachePage;
import com.example.post.domain.Post;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

public class RedisFeedCacheAdapter implements FeedCachePort {
    private final StringRedisTemplate redisTemplate;
    private final Clock clock;
    private final int maxSize;
    private final Duration ttl;
    private final String keyPrefix;

    public RedisFeedCacheAdapter(StringRedisTemplate redisTemplate,
                                 Clock clock,
                                 @Value("${post.redis.feed.max-size:500}") int maxSize,
                                 @Value("${post.redis.feed.ttl:PT6H}") Duration ttl,
                                 @Value("${post.redis.feed.key-prefix:post:feed:}") String keyPrefix) {
        this.redisTemplate = redisTemplate;
        this.clock = clock;
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.keyPrefix = keyPrefix;
    }

    @Override
    public FeedCachePage fetchFeed(UUID userId, String cursor, int limit) {
        if (userId == null) {
            return new FeedCachePage(List.of(), null);
        }
        int pageLimit = limit > 0 ? limit : 10;
        FeedCursor cursorKey = parseCursor(cursor);
        double maxScore = cursorKey == null ? Double.MAX_VALUE : cursorKey.score();
        double minScore = -Double.MAX_VALUE;

        ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
        String key = feedKey(userId);
        var tupleSet = zset.reverseRangeByScoreWithScores(
                key,
                minScore,
                maxScore
        );
        if (tupleSet == null || tupleSet.isEmpty()) {
            return new FeedCachePage(List.of(), null);
        }
        List<ZSetOperations.TypedTuple<String>> tuples = new ArrayList<>(tupleSet);
        tuples.sort((left, right) -> {
            Double leftScore = left.getScore();
            Double rightScore = right.getScore();
            if (leftScore == null && rightScore == null) {
                return 0;
            }
            if (leftScore == null) {
                return 1;
            }
            if (rightScore == null) {
                return -1;
            }
            int scoreCompare = Double.compare(rightScore, leftScore);
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            String leftValue = left.getValue();
            String rightValue = right.getValue();
            if (leftValue == null && rightValue == null) {
                return 0;
            }
            if (leftValue == null) {
                return 1;
            }
            if (rightValue == null) {
                return -1;
            }
            return rightValue.compareTo(leftValue);
        });

        List<ZSetOperations.TypedTuple<String>> eligible = new ArrayList<>();
        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            if (isAfterCursor(tuple, cursorKey)) {
                eligible.add(tuple);
                if (eligible.size() >= pageLimit + 1) {
                    break;
                }
            }
        }

        List<UUID> ids = new ArrayList<>();
        String nextCursor = null;
        int size = eligible.size();
        int maxIndex = Math.min(size, pageLimit);
        for (int index = 0; index < maxIndex; index++) {
            ZSetOperations.TypedTuple<String> tuple = eligible.get(index);
            if (tuple == null || tuple.getValue() == null) {
                continue;
            }
            ids.add(UUID.fromString(tuple.getValue()));
        }
        if (size > pageLimit && maxIndex > 0) {
            ZSetOperations.TypedTuple<String> lastTuple = eligible.get(maxIndex - 1);
            if (lastTuple != null && lastTuple.getScore() != null) {
                long score = lastTuple.getScore().longValue();
                nextCursor = encodeCursor(score, lastTuple.getValue());
            }
        }
        return new FeedCachePage(ids, nextCursor);
    }

    @Override
    public void pushToFeed(UUID userId, Post post) {
        if (userId == null || post == null) {
            return;
        }
        String key = feedKey(userId);
        double score = scoreFor(post);
        redisTemplate.opsForZSet().add(key, post.id().toString(), score);
        expire(key);
        trim(key);
    }

    @Override
    public void pushToFeed(UUID userId, List<Post> posts) {
        if (userId == null || posts == null || posts.isEmpty()) {
            return;
        }
        for (Post post : posts) {
            pushToFeed(userId, post);
        }
    }

    @Override
    public void pushToFeeds(List<UUID> userIds, Post post) {
        if (userIds == null || userIds.isEmpty() || post == null) {
            return;
        }
        for (UUID userId : userIds) {
            pushToFeed(userId, post);
        }
    }

    @Override
    public void clear(UUID userId) {
        if (userId == null) {
            return;
        }
        redisTemplate.delete(feedKey(userId));
    }

    private String feedKey(UUID userId) {
        return keyPrefix + userId;
    }

    private void expire(String key) {
        if (ttl != null && !ttl.isZero() && !ttl.isNegative()) {
            redisTemplate.expire(key, ttl);
        }
    }

    private void trim(String key) {
        if (maxSize > 0) {
            redisTemplate.opsForZSet().removeRange(key, 0, -maxSize - 1);
        }
    }

    private double scoreFor(Post post) {
        Instant createdAt = post.createdAt() != null ? post.createdAt() : clock.instant();
        return createdAt.toEpochMilli();
    }

    private boolean isAfterCursor(ZSetOperations.TypedTuple<String> tuple, FeedCursor cursor) {
        if (tuple == null || tuple.getScore() == null) {
            return false;
        }
        if (cursor == null) {
            return true;
        }
        long score = tuple.getScore().longValue();
        if (score < cursor.score()) {
            return true;
        }
        if (score > cursor.score()) {
            return false;
        }
        if (cursor.postId() == null || cursor.postId().isBlank() || tuple.getValue() == null) {
            return false;
        }
        return tuple.getValue().compareTo(cursor.postId()) < 0;
    }

    private String encodeCursor(long score, String postId) {
        if (postId == null || postId.isBlank()) {
            return Long.toString(score);
        }
        return score + "|" + postId;
    }

    private FeedCursor parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        String[] parts = cursor.split("\\|", -1);
        if (parts.length == 0 || parts[0].isBlank()) {
            return null;
        }
        try {
            long score = Long.parseLong(parts[0]);
            String postId = parts.length >= 2 && !parts[1].isBlank() ? parts[1] : null;
            return new FeedCursor(score, postId);
        } catch (NumberFormatException ignored) {
            try {
                long score = Instant.parse(parts[0]).toEpochMilli();
                String postId = parts.length >= 2 && !parts[1].isBlank() ? parts[1] : null;
                return new FeedCursor(score, postId);
            } catch (DateTimeParseException ex) {
                return null;
            }
        }
    }

    private record FeedCursor(long score, String postId) {
    }
}
