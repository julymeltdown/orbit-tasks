package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {
    private final Map<String, ImportJobView> jobs = new ConcurrentHashMap<>();

    @PostMapping("/imports/preview")
    public PreviewResponse preview(@Valid @RequestBody PreviewRequest request) {
        List<String> errors = request.mapping() == null || request.mapping().isEmpty()
                ? List.of("mapping is required")
                : List.of();
        List<String> warnings = request.includeComments()
                ? List.of()
                : List.of("comments are excluded and linked externally");
        return new PreviewResponse(errors.isEmpty(), errors, warnings);
    }

    @PostMapping("/imports/execute")
    public ImportJobView execute(@Valid @RequestBody ExecuteImportRequest request) {
        String jobId = UUID.randomUUID().toString();
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("jobId", jobId);
        snapshot.put("createdAt", Instant.now().toString());
        snapshot.put("sourceRef", request.sourceRef());

        ImportJobView job = new ImportJobView(
                jobId,
                request.workspaceId(),
                request.sourceSystem(),
                request.sourceRef(),
                "completed",
                snapshot,
                Instant.now().toString());
        jobs.put(jobId, job);
        return job;
    }

    @PostMapping("/imports/{jobId}/rollback")
    public ImportJobView rollback(@PathVariable String jobId) {
        ImportJobView current = jobs.get(jobId);
        if (current == null) {
            throw new IllegalArgumentException("Import job not found");
        }
        ImportJobView rolledBack = new ImportJobView(
                current.jobId(),
                current.workspaceId(),
                current.sourceSystem(),
                current.sourceRef(),
                "rolled_back",
                current.rollbackSnapshot(),
                Instant.now().toString());
        jobs.put(jobId, rolledBack);
        return rolledBack;
    }

    @GetMapping("/imports/{jobId}")
    public ImportJobView getJob(@PathVariable String jobId) {
        ImportJobView current = jobs.get(jobId);
        if (current == null) {
            throw new IllegalArgumentException("Import job not found");
        }
        return current;
    }

    public record PreviewRequest(
            @NotBlank String workspaceId,
            @NotBlank String sourceSystem,
            @NotBlank String sourceRef,
            Map<String, String> mapping,
            boolean includeComments,
            boolean includeAttachments
    ) {
    }

    public record PreviewResponse(boolean valid, List<String> errors, List<String> warnings) {
    }

    public record ExecuteImportRequest(
            @NotBlank String workspaceId,
            @NotBlank String sourceSystem,
            @NotBlank String sourceRef,
            Map<String, String> mapping,
            String actor
    ) {
    }

    public record ImportJobView(
            String jobId,
            String workspaceId,
            String sourceSystem,
            String sourceRef,
            String status,
            Map<String, Object> rollbackSnapshot,
            String updatedAt
    ) {
    }
}
