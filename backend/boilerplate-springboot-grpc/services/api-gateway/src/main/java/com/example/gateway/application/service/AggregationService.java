package com.example.gateway.application.service;

import com.example.gateway.application.dto.aggregation.AggregationResponse;
import com.example.gateway.application.port.out.AggregationRecipeRepository;
import com.example.gateway.application.port.out.ResponseCache;
import com.example.gateway.domain.aggregation.AggregationRecipe;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AggregationService {
    private final AggregationRecipeRepository repository;
    private final ResponseCache cache;
    private final Duration cacheTtl;

    public AggregationService(
            AggregationRecipeRepository repository,
            ResponseCache cache,
            @Value("${gateway.aggregation.cache-ttl:PT30S}") Duration cacheTtl) {
        this.repository = repository;
        this.cache = cache;
        this.cacheTtl = cacheTtl;
    }

    public AggregationResponse aggregate(String routeKey) {
        String cacheKey = "aggregation:" + routeKey;
        return cache.get(cacheKey)
                .map(response -> new AggregationResponse(routeKey, true, response.payload()))
                .orElseGet(() -> buildAndCache(routeKey, cacheKey));
    }

    private AggregationResponse buildAndCache(String routeKey, String cacheKey) {
        AggregationRecipe recipe = repository.findByRouteKey(routeKey)
                .orElseThrow(() -> new IllegalArgumentException("Aggregation recipe not found: " + routeKey));
        Map<String, Object> payload = new HashMap<>();
        payload.put("routeKey", routeKey);
        payload.put("joinStrategy", recipe.joinStrategy());
        payload.put("downstreams", recipe.downstreamCalls());
        AggregationResponse response = new AggregationResponse(routeKey, false, payload);
        cache.put(cacheKey, response, cacheTtl);
        return response;
    }
}
