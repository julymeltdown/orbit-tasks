package com.example.post.config;

import com.example.post.adapters.out.cache.NoopFeedCacheAdapter;
import com.example.post.adapters.out.cache.NoopPostCacheAdapter;
import com.example.post.adapters.out.redis.RedisFeedCacheAdapter;
import com.example.post.adapters.out.redis.RedisPostCacheAdapter;
import com.example.post.adapters.out.redis.RedisPostLikeRepository;
import com.example.post.application.port.out.FeedCachePort;
import com.example.post.application.port.out.PostCachePort;
import com.example.post.application.port.out.PostLikeRepositoryPort;
import tools.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RedisCacheConfig {
    @Bean
    @ConditionalOnProperty(name = "post.redis.enabled", havingValue = "true")
    FeedCachePort redisFeedCachePort(StringRedisTemplate redisTemplate,
                                     Clock clock,
                                     @Value("${post.redis.feed.max-size:500}") int maxSize,
                                     @Value("${post.redis.feed.ttl:PT6H}") Duration ttl,
                                     @Value("${post.redis.feed.key-prefix:post:feed:}") String keyPrefix) {
        return new RedisFeedCacheAdapter(redisTemplate, clock, maxSize, ttl, keyPrefix);
    }

    @Bean
    @ConditionalOnProperty(name = "post.redis.enabled", havingValue = "true")
    PostCachePort redisPostCachePort(StringRedisTemplate redisTemplate,
                                     ObjectMapper objectMapper,
                                     @Value("${post.redis.post.ttl:PT12H}") Duration ttl,
                                     @Value("${post.redis.post.key-prefix:post:cache:}") String keyPrefix) {
        return new RedisPostCacheAdapter(redisTemplate, objectMapper, ttl, keyPrefix);
    }

    @Bean
    @ConditionalOnProperty(name = "post.redis.enabled", havingValue = "true")
    PostLikeRepositoryPort redisPostLikeRepository(StringRedisTemplate redisTemplate) {
        return new RedisPostLikeRepository(redisTemplate);
    }

    @Bean
    @ConditionalOnMissingBean(FeedCachePort.class)
    FeedCachePort noopFeedCachePort() {
        return new NoopFeedCacheAdapter();
    }

    @Bean
    @ConditionalOnMissingBean(PostCachePort.class)
    PostCachePort noopPostCachePort() {
        return new NoopPostCacheAdapter();
    }
}
