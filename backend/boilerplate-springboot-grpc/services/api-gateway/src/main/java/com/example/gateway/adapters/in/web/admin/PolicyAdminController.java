package com.example.gateway.adapters.in.web.admin;

import com.example.gateway.application.service.PolicyService;
import com.example.gateway.domain.policy.PolicySet;
import com.example.gateway.domain.policy.RateLimitPolicy;
import com.example.gateway.domain.policy.ResiliencePolicy;
import com.example.gateway.domain.policy.RolloutPolicy;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/policies")
public class PolicyAdminController {
    private final PolicyService policyService;

    public PolicyAdminController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public List<PolicySet> listPolicies() {
        return policyService.listPolicies();
    }

    @GetMapping("/{policyId}")
    public PolicySet getPolicy(@PathVariable String policyId) {
        return policyService.getPolicy(policyId);
    }

    @PostMapping
    public ResponseEntity<PolicySet> createPolicy(@RequestBody PolicySetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(policyService.createPolicy(toPolicy(null, request)));
    }

    @PutMapping("/{policyId}")
    public PolicySet updatePolicy(@PathVariable String policyId, @RequestBody PolicySetRequest request) {
        return policyService.createPolicy(toPolicy(policyId, request));
    }

    private PolicySet toPolicy(String policyId, PolicySetRequest request) {
        RateLimitPolicy rateLimit = null;
        if (request.rateLimit() != null) {
            rateLimit = new RateLimitPolicy(
                    request.rateLimit().requestsPerMinute(),
                    request.rateLimit().burst());
        }
        ResiliencePolicy resilience = null;
        if (request.resilience() != null) {
            resilience = new ResiliencePolicy(
                    request.resilience().timeoutMs(),
                    request.resilience().retryMax(),
                    request.resilience().circuitBreakerEnabled());
        }
        RolloutPolicy rollout = null;
        if (request.rollout() != null) {
            rollout = new RolloutPolicy(
                    request.rollout().id(),
                    request.rollout().contractId(),
                    request.rollout().version(),
                    request.rollout().strategy(),
                    request.rollout().status(),
                    request.rollout().percent());
        }
        return new PolicySet(
                policyId,
                Optional.ofNullable(request.name()).orElse("default"),
                rateLimit,
                resilience,
                rollout,
                request.cachePolicy());
    }

    public record PolicySetRequest(
            String name,
            RateLimitInput rateLimit,
            ResilienceInput resilience,
            RolloutInput rollout,
            String cachePolicy
    ) {
    }

    public record RateLimitInput(Integer requestsPerMinute, Integer burst) {
    }

    public record ResilienceInput(Integer timeoutMs, Integer retryMax, Boolean circuitBreakerEnabled) {
    }

    public record RolloutInput(
            String id,
            String contractId,
            String version,
            String strategy,
            String status,
            Integer percent
    ) {
    }
}
