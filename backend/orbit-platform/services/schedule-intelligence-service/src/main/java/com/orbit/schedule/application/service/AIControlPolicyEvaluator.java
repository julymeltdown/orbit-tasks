package com.orbit.schedule.application.service;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AIControlPolicyEvaluator {

    public Decision evaluate(Policy policy, Payload payload) {
        if (!policy.enabled()) {
            return new Decision(false, "policy_disabled", List.of("AI request blocked by admin"));
        }
        if (policy.requireStoreFalse() && payload.storeEnabled()) {
            return new Decision(false, "store_must_be_false", List.of("Set store:false for request"));
        }
        if (policy.maskPii() && payload.containsSensitiveData()) {
            return new Decision(true, "mask_required", List.of("PII mask step required before dispatch"));
        }
        if (policy.maxTokensPerCall() > 0 && payload.estimatedTokens() > policy.maxTokensPerCall()) {
            return new Decision(false, "token_budget_exceeded", List.of("Reduce context size or use batch mode"));
        }
        return new Decision(true, "allowed", List.of("Dispatch allowed"));
    }

    public record Policy(boolean enabled, boolean requireStoreFalse, boolean maskPii, int maxTokensPerCall) {
    }

    public record Payload(boolean storeEnabled, boolean containsSensitiveData, int estimatedTokens) {
    }

    public record Decision(boolean allowed, String reason, List<String> directives) {
    }
}
