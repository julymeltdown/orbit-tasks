package com.example.gateway.application.dto.aggregation;

import java.util.Map;

public record AggregationResponse(String routeKey, boolean cached, Map<String, Object> payload) {
}
