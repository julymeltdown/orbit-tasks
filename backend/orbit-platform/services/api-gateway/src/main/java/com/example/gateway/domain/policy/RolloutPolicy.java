package com.example.gateway.domain.policy;

public record RolloutPolicy(String id, String contractId, String version, String strategy, String status, Integer percent) {
}
