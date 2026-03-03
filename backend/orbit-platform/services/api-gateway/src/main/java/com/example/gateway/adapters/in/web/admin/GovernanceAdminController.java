package com.example.gateway.adapters.in.web.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/governance")
public class GovernanceAdminController {
    private final Map<String, List<AuditEventView>> auditByWorkspace = new ConcurrentHashMap<>();
    private final Map<String, List<RetentionRuleView>> rulesByWorkspace = new ConcurrentHashMap<>();
    private final Map<String, List<AIControlPolicyView>> aiPolicyByWorkspace = new ConcurrentHashMap<>();

    @PostMapping("/retention-rules")
    public RetentionRuleView upsertRetentionRule(@Valid @RequestBody UpsertRetentionRuleRequest request) {
        RetentionRuleView rule = new RetentionRuleView(
                UUID.randomUUID().toString(),
                request.workspaceId(),
                request.dataset(),
                request.retentionDays(),
                request.hardDelete(),
                Instant.now().toString());
        rulesByWorkspace.computeIfAbsent(request.workspaceId(), ignored -> new ArrayList<>())
                .removeIf(existing -> existing.dataset().equals(request.dataset()));
        rulesByWorkspace.computeIfAbsent(request.workspaceId(), ignored -> new ArrayList<>()).add(rule);

        appendAudit(request.workspaceId(), request.actor(), "RETENTION_RULE_UPDATED", request.dataset(), Map.of(
                "retentionDays", request.retentionDays(),
                "hardDelete", request.hardDelete()));
        return rule;
    }

    @PostMapping("/ai-controls")
    public AIControlPolicyView upsertAiControl(@Valid @RequestBody UpsertAIControlRequest request) {
        AIControlPolicyView policy = new AIControlPolicyView(
                UUID.randomUUID().toString(),
                request.workspaceId(),
                request.requireStoreFalse(),
                request.maskPii(),
                request.maxTokensPerCall(),
                request.enabled(),
                Instant.now().toString());
        aiPolicyByWorkspace.computeIfAbsent(request.workspaceId(), ignored -> new ArrayList<>()).clear();
        aiPolicyByWorkspace.computeIfAbsent(request.workspaceId(), ignored -> new ArrayList<>()).add(policy);

        appendAudit(request.workspaceId(), request.actor(), "AI_CONTROL_UPDATED", "ai_policy", Map.of(
                "requireStoreFalse", request.requireStoreFalse(),
                "maskPii", request.maskPii(),
                "maxTokensPerCall", request.maxTokensPerCall(),
                "enabled", request.enabled()));
        return policy;
    }

    @GetMapping("/audit-events")
    public List<AuditEventView> auditEvents(@RequestParam String workspaceId) {
        return List.copyOf(auditByWorkspace.getOrDefault(workspaceId, List.of()));
    }

    @GetMapping("/retention-rules")
    public List<RetentionRuleView> retentionRules(@RequestParam String workspaceId) {
        return List.copyOf(rulesByWorkspace.getOrDefault(workspaceId, List.of()));
    }

    @GetMapping("/ai-controls")
    public List<AIControlPolicyView> aiControls(@RequestParam String workspaceId) {
        return List.copyOf(aiPolicyByWorkspace.getOrDefault(workspaceId, List.of()));
    }

    private void appendAudit(String workspaceId, String actor, String action, String target, Map<String, Object> payload) {
        auditByWorkspace.computeIfAbsent(workspaceId, ignored -> new ArrayList<>())
                .add(new AuditEventView(
                        UUID.randomUUID().toString(),
                        workspaceId,
                        actor,
                        action,
                        target,
                        payload,
                        Instant.now().toString()));
    }

    public record UpsertRetentionRuleRequest(
            @NotBlank String workspaceId,
            @NotBlank String dataset,
            int retentionDays,
            boolean hardDelete,
            @NotBlank String actor
    ) {
    }

    public record UpsertAIControlRequest(
            @NotBlank String workspaceId,
            boolean requireStoreFalse,
            boolean maskPii,
            int maxTokensPerCall,
            boolean enabled,
            @NotBlank String actor
    ) {
    }

    public record AuditEventView(
            String eventId,
            String workspaceId,
            String actor,
            String action,
            String target,
            Map<String, Object> payload,
            String createdAt
    ) {
    }

    public record RetentionRuleView(
            String ruleId,
            String workspaceId,
            String dataset,
            int retentionDays,
            boolean hardDelete,
            String updatedAt
    ) {
    }

    public record AIControlPolicyView(
            String policyId,
            String workspaceId,
            boolean requireStoreFalse,
            boolean maskPii,
            int maxTokensPerCall,
            boolean enabled,
            String updatedAt
    ) {
    }
}
