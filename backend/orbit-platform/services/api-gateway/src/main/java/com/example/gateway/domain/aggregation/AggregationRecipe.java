package com.example.gateway.domain.aggregation;

import java.util.List;

public record AggregationRecipe(
        String id,
        String routeKey,
        List<DownstreamCall> downstreamCalls,
        String joinStrategy,
        Integer timeoutMs,
        String cachePolicy
) {
    public record DownstreamCall(String service, String path, List<String> fields) {
    }
}
