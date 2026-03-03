package com.example.gateway.adapters.out.cache;

import com.example.gateway.application.dto.aggregation.AggregationResponse;
import com.example.gateway.application.port.out.ResponseCache;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ResponseCacheAdapter implements ResponseCache {
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Override
    public Optional<AggregationResponse> get(String cacheKey) {
        CacheEntry entry = cache.get(cacheKey);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            cache.remove(cacheKey);
            return Optional.empty();
        }
        return Optional.of(entry.response());
    }

    @Override
    public void put(String cacheKey, AggregationResponse response, Duration ttl) {
        cache.put(cacheKey, new CacheEntry(response, Instant.now().plus(ttl)));
    }

    private record CacheEntry(AggregationResponse response, Instant expiresAt) {
    }
}
