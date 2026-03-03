package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/insights")
public class ScheduleEvaluationController {
    private final Map<UUID, ScheduleEvaluationResponse> evaluations = new ConcurrentHashMap<>();

    @PostMapping("/schedule-evaluations")
    public ScheduleEvaluationResponse evaluate(@Valid @RequestBody ScheduleEvaluationRequest request) {
        int loadDelta = request.remainingStoryPoints() - request.availableCapacitySp();
        boolean overload = loadDelta > 0;
        boolean blocked = request.blockedCount() > 0;
        boolean atRisk = request.atRiskCount() > 0;

        String health = blocked || overload ? "at_risk" : atRisk ? "warning" : "healthy";
        double confidence = request.simulateAiFailure() ? 0.42 : blocked ? 0.74 : 0.68;

        List<RiskItem> risks = List.of(new RiskItem(
                overload ? "capacity_overload" : blocked ? "external_dependency" : "flow_variance",
                overload ? "Remaining scope exceeds capacity" : blocked ? "External approval pending" : "At-risk drift detected",
                overload ? "Milestone slip risk" : "Sprint goal may miss",
                List.of("Rebalance scope", "Assign owner", "Track ETA"),
                List.of("WORKGRAPH", "DSU", "SPRINT")));

        List<String> questions = List.of(
                "Can we reduce scope this week?",
                "Who owns blocker removal and by when?");

        ScheduleEvaluationResponse response = new ScheduleEvaluationResponse(
                UUID.randomUUID().toString(),
                health,
                risks,
                questions,
                confidence,
                request.simulateAiFailure(),
                request.simulateAiFailure() ? "fallback_rules_only" : "ok");
        evaluations.put(UUID.fromString(request.projectId()), response);
        return response;
    }

    @PostMapping("/schedule-evaluations/actions")
    public EvaluationActionResponse action(@Valid @RequestBody EvaluationActionRequest request) {
        return new EvaluationActionResponse(
                request.evaluationId(),
                request.action(),
                request.note() == null ? "" : request.note(),
                "recorded");
    }

    public record ScheduleEvaluationRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            String sprintId,
            @Min(0) int remainingStoryPoints,
            @Min(0) int availableCapacitySp,
            @Min(0) int blockedCount,
            @Min(0) int atRiskCount,
            boolean simulateAiFailure
    ) {
    }

    public record RiskItem(
            String type,
            String summary,
            String impact,
            List<String> recommendedActions,
            List<String> evidence
    ) {
    }

    public record ScheduleEvaluationResponse(
            String evaluationId,
            String health,
            List<RiskItem> topRisks,
            List<String> questions,
            @Min(0) @Max(1) double confidence,
            boolean fallback,
            String reason
    ) {
    }

    public record EvaluationActionRequest(
            @NotBlank String evaluationId,
            @NotBlank String action,
            String note,
            Map<String, Object> patch
    ) {
    }

    public record EvaluationActionResponse(String evaluationId, String action, String note, String status) {
    }
}
