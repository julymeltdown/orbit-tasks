package com.orbit.identity.application.service;

import com.orbit.eventkit.audit.AuditSinkAdapter;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class GovernanceAdminService {
    private final RetentionPolicyScheduler retentionPolicyScheduler;
    private final AuditSinkAdapter auditSinkAdapter;

    public GovernanceAdminService(RetentionPolicyScheduler retentionPolicyScheduler,
                                  AuditSinkAdapter auditSinkAdapter) {
        this.retentionPolicyScheduler = retentionPolicyScheduler;
        this.auditSinkAdapter = auditSinkAdapter;
    }

    public RetentionPolicyScheduler.RetentionRule upsertRetentionRule(String workspaceId,
                                                                      String dataset,
                                                                      int retentionDays,
                                                                      boolean hardDelete,
                                                                      String actor) {
        RetentionPolicyScheduler.RetentionRule rule = retentionPolicyScheduler.upsert(
                workspaceId,
                dataset,
                retentionDays,
                hardDelete);
        auditSinkAdapter.append(
                workspaceId,
                actor,
                "RETENTION_POLICY_UPDATED",
                "retention_rule",
                dataset,
                Map.of(
                        "retentionDays", retentionDays,
                        "hardDelete", hardDelete,
                        "updatedAt", Instant.now().toString()));
        return rule;
    }

    public List<AuditSinkAdapter.AuditEnvelope> listAuditEvents(String workspaceId) {
        return auditSinkAdapter.findByWorkspace(workspaceId);
    }

    public List<RetentionPolicyScheduler.RetentionExecution> listRetentionExecutions(String workspaceId) {
        return retentionPolicyScheduler.listExecutions(workspaceId);
    }
}
