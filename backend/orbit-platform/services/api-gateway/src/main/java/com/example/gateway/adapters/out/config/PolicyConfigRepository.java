package com.example.gateway.adapters.out.config;

import com.example.gateway.application.port.out.PolicySetRepository;
import com.example.gateway.config.GatewayGovernanceProperties;
import com.example.gateway.domain.policy.PolicySet;
import com.example.gateway.domain.policy.RateLimitPolicy;
import com.example.gateway.domain.policy.ResiliencePolicy;
import com.example.gateway.domain.policy.RolloutPolicy;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class PolicyConfigRepository implements PolicySetRepository {
    private final Map<String, PolicySet> policies = new ConcurrentHashMap<>();

    public PolicyConfigRepository(GatewayGovernanceProperties properties) {
        loadFromConfig(properties);
    }

    @Override
    public List<PolicySet> findAll() {
        return List.copyOf(policies.values());
    }

    @Override
    public Optional<PolicySet> findById(String policyId) {
        return Optional.ofNullable(policies.get(policyId));
    }

    @Override
    public PolicySet save(PolicySet policySet) {
        String id = (policySet.id() == null || policySet.id().isBlank())
                ? UUID.randomUUID().toString()
                : policySet.id();
        PolicySet updated = new PolicySet(
                id,
                policySet.name(),
                policySet.rateLimit(),
                policySet.resilience(),
                policySet.rollout(),
                policySet.cachePolicy());
        policies.put(id, updated);
        return updated;
    }

    private void loadFromConfig(GatewayGovernanceProperties properties) {
        for (GatewayGovernanceProperties.PolicySetDefinition definition : properties.getPolicies()) {
            String id = (definition.getId() == null || definition.getId().isBlank())
                    ? UUID.randomUUID().toString()
                    : definition.getId();
            RateLimitPolicy rateLimit = null;
            if (definition.getRateLimit() != null) {
                rateLimit = new RateLimitPolicy(
                        definition.getRateLimit().getRequestsPerMinute(),
                        definition.getRateLimit().getBurst());
            }
            ResiliencePolicy resilience = null;
            if (definition.getResilience() != null) {
                resilience = new ResiliencePolicy(
                        definition.getResilience().getTimeoutMs(),
                        definition.getResilience().getRetryMax(),
                        definition.getResilience().getCircuitBreakerEnabled());
            }
            RolloutPolicy rollout = null;
            if (definition.getRollout() != null) {
                rollout = new RolloutPolicy(
                        UUID.randomUUID().toString(),
                        null,
                        null,
                        definition.getRollout().getStrategy(),
                        "active",
                        definition.getRollout().getPercent());
            }
            PolicySet policySet = new PolicySet(
                    id,
                    definition.getName(),
                    rateLimit,
                    resilience,
                    rollout,
                    definition.getCachePolicy());
            policies.put(id, policySet);
        }
    }
}
