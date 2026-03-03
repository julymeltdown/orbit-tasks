package com.example.gateway.application.service;

import com.example.gateway.application.port.out.PolicySetRepository;
import com.example.gateway.domain.policy.PolicySet;
import com.example.gateway.domain.policy.RolloutPolicy;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PolicyService {
    private final PolicySetRepository repository;
    private final Map<String, RolloutPolicy> rollouts = new ConcurrentHashMap<>();

    public PolicyService(PolicySetRepository repository) {
        this.repository = repository;
    }

    public List<PolicySet> listPolicies() {
        return repository.findAll();
    }

    public PolicySet getPolicy(String policyId) {
        return repository.findById(policyId)
                .orElseThrow(() -> new IllegalArgumentException("Policy set not found: " + policyId));
    }

    public PolicySet createPolicy(PolicySet policySet) {
        return repository.save(policySet);
    }

    public PolicySet defaultPolicy() {
        return repository.findAll().stream().findFirst().orElse(null);
    }

    public RolloutPolicy createRollout(RolloutPolicy rollout) {
        String id = rollout.id() == null || rollout.id().isBlank()
                ? UUID.randomUUID().toString()
                : rollout.id();
        RolloutPolicy stored = new RolloutPolicy(
                id,
                rollout.contractId(),
                rollout.version(),
                rollout.strategy(),
                rollout.status(),
                rollout.percent());
        rollouts.put(id, stored);
        return stored;
    }

    public RolloutPolicy getRollout(String rolloutId) {
        RolloutPolicy rollout = rollouts.get(rolloutId);
        if (rollout == null) {
            throw new IllegalArgumentException("Rollout not found: " + rolloutId);
        }
        return rollout;
    }
}
