package com.orbit.identity.application.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class RetentionPolicyScheduler {
    private final List<RetentionRule> rules = new CopyOnWriteArrayList<>();
    private final List<RetentionExecution> executionLog = new CopyOnWriteArrayList<>();

    public RetentionRule upsert(String workspaceId, String dataset, int retentionDays, boolean hardDelete) {
        RetentionRule rule = new RetentionRule(workspaceId, dataset, retentionDays, hardDelete, Instant.now());
        rules.removeIf(existing -> existing.workspaceId().equals(workspaceId) && existing.dataset().equals(dataset));
        rules.add(rule);
        return rule;
    }

    public List<RetentionRule> listRules(String workspaceId) {
        List<RetentionRule> result = new ArrayList<>();
        for (RetentionRule rule : rules) {
            if (rule.workspaceId().equals(workspaceId)) {
                result.add(rule);
            }
        }
        return result;
    }

    public List<RetentionExecution> listExecutions(String workspaceId) {
        List<RetentionExecution> result = new ArrayList<>();
        for (RetentionExecution execution : executionLog) {
            if (execution.workspaceId().equals(workspaceId)) {
                result.add(execution);
            }
        }
        return result;
    }

    @Scheduled(cron = "0 */30 * * * *")
    public void runScheduledSweep() {
        Instant now = Instant.now();
        for (RetentionRule rule : rules) {
            Instant cutoff = now.minus(rule.retentionDays(), ChronoUnit.DAYS);
            executionLog.add(new RetentionExecution(
                    rule.workspaceId(),
                    rule.dataset(),
                    cutoff,
                    rule.hardDelete() ? "hard_delete" : "soft_delete",
                    "completed",
                    now));
        }
    }

    public record RetentionRule(String workspaceId, String dataset, int retentionDays, boolean hardDelete, Instant updatedAt) {
    }

    public record RetentionExecution(
            String workspaceId,
            String dataset,
            Instant cutoff,
            String mode,
            String status,
            Instant executedAt
    ) {
    }
}
