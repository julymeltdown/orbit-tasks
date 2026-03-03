package com.example.gateway.adapters.in.web.admin;

import com.example.gateway.application.service.PolicyService;
import com.example.gateway.domain.policy.RolloutPolicy;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/rollouts")
public class RolloutAdminController {
    private final PolicyService policyService;

    public RolloutAdminController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @PostMapping
    public ResponseEntity<RolloutPolicy> createRollout(@RequestBody RolloutCreateRequest request) {
        RolloutPolicy rollout = new RolloutPolicy(
                null,
                request.contractId(),
                request.version(),
                request.strategy(),
                Optional.ofNullable(request.status()).orElse("active"),
                request.percent());
        return ResponseEntity.status(HttpStatus.CREATED).body(policyService.createRollout(rollout));
    }

    @GetMapping("/{rolloutId}")
    public RolloutPolicy getRollout(@PathVariable String rolloutId) {
        return policyService.getRollout(rolloutId);
    }

    public record RolloutCreateRequest(
            String contractId,
            String version,
            String strategy,
            String status,
            Integer percent
    ) {
    }
}
