package com.orbit.migration.application.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ImportExecutionService {
    private final Map<String, ImportJob> jobs = new ConcurrentHashMap<>();

    public ImportJob execute(String workspaceId,
                             String sourceSystem,
                             String sourceRef,
                             ImportValidationService.ValidationReport validationReport,
                             String actor) {
        if (!validationReport.valid()) {
            throw new IllegalArgumentException("Validation failed: " + validationReport.errors());
        }

        String jobId = UUID.randomUUID().toString();
        Map<String, Object> rollbackSnapshot = new HashMap<>();
        rollbackSnapshot.put("createdAt", Instant.now().toString());
        rollbackSnapshot.put("sourceRef", sourceRef);
        rollbackSnapshot.put("status", "snapshot_ready");

        ImportJob job = new ImportJob(
                jobId,
                workspaceId,
                sourceSystem,
                sourceRef,
                "completed",
                rollbackSnapshot,
                actor,
                Instant.now().toString());
        jobs.put(jobId, job);
        return job;
    }

    public ImportJob rollback(String jobId) {
        ImportJob job = jobs.get(jobId);
        if (job == null) {
            throw new IllegalArgumentException("Import job not found");
        }
        ImportJob rolledBack = new ImportJob(
                job.jobId(),
                job.workspaceId(),
                job.sourceSystem(),
                job.sourceRef(),
                "rolled_back",
                job.rollbackSnapshot(),
                job.actor(),
                Instant.now().toString());
        jobs.put(jobId, rolledBack);
        return rolledBack;
    }

    public record ImportJob(
            String jobId,
            String workspaceId,
            String sourceSystem,
            String sourceRef,
            String status,
            Map<String, Object> rollbackSnapshot,
            String actor,
            String updatedAt
    ) {
    }
}
