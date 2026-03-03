package com.example.gateway.application.port.out;

import com.example.gateway.application.dto.aggregation.AggregationResponse;
import java.time.Duration;
import java.util.Optional;

public interface ResponseCache {
    Optional<AggregationResponse> get(String cacheKey);

    void put(String cacheKey, AggregationResponse response, Duration ttl);
}
