package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.ScheduleEvaluationHistoryService;
import com.example.gateway.domain.schedule.ScheduleAction;
import com.example.gateway.domain.schedule.ScheduleEvaluationSnapshot;
import com.example.gateway.domain.schedule.ScheduleRisk;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping
public class ScheduleEvaluationController {
    private final ScheduleEvaluationHistoryService historyService;

    public ScheduleEvaluationController(ScheduleEvaluationHistoryService historyService) {
        this.historyService = historyService;
    }

    // legacy compatibility
    @PostMapping("/api/insights/schedule-evaluations")
    public ScheduleEvaluationResponse evaluateLegacy(@Valid @RequestBody ScheduleEvaluationRequest request) {
        return evaluateV2(request);
    }

    @PostMapping("/api/v2/insights/evaluations")
    public ScheduleEvaluationResponse evaluateV2(@Valid @RequestBody ScheduleEvaluationRequest request) {
        int loadDelta = request.remainingStoryPoints() - request.availableCapacitySp();
        boolean overload = loadDelta > 0;
        boolean blocked = request.blockedCount() > 0;
        boolean atRisk = request.atRiskCount() > 0;
        boolean noSignals = request.remainingStoryPoints() == 0 && request.blockedCount() == 0 && request.atRiskCount() == 0;

        String health = noSignals ? "warning" : blocked || overload ? "at_risk" : atRisk ? "warning" : "healthy";
        double confidence = request.simulateAiFailure() ? 0.42 : noSignals ? 0.51 : blocked ? 0.74 : 0.68;

        List<RiskItem> risks = List.of(new RiskItem(
                overload ? "capacity_overload" : blocked ? "external_dependency" : "flow_variance",
                overload ? "Remaining scope exceeds capacity" : blocked ? "External approval pending" : "At-risk drift detected",
                overload ? "Milestone slip risk" : "Sprint goal may miss",
                List.of("Rebalance scope", "Assign owner", "Track ETA"),
                List.of("WORKGRAPH", "DSU", "SPRINT")
        ));

        List<String> questions = new ArrayList<>();
        questions.add("Can we reduce scope this week?");
        questions.add("Who owns blocker removal and by when?");
        if (request.selectedWorkItemId() != null && !request.selectedWorkItemId().isBlank()) {
            questions.add("Does the selected work item need a dependency review?");
        }

        List<ActionItem> actions = List.of(
                new ActionItem("ACTION_SCOPE_REBALANCE", "Rebalance scope for this sprint", "draft", null),
                new ActionItem("ACTION_BLOCKER_OWNER", "Assign blocker owner and ETA", "draft", null)
        );

        String reason = normalizeReason(request.simulateAiFailure() ? "fallback_rules_only" : noSignals ? "no_data" : "llm_success", request.simulateAiFailure());

        ScheduleEvaluationResponse response = new ScheduleEvaluationResponse(
                UUID.randomUUID().toString(),
                health,
                risks,
                questions,
                actions,
                confidence,
                request.simulateAiFailure(),
                reason
        );
        historyService.save(toSnapshot(request, response));
        return response;
    }

    @GetMapping("/api/v2/insights/evaluations/latest")
    public ScheduleEvaluationResponse latestV2(@RequestParam String workspaceId, @RequestParam String projectId) {
        return historyService.findLatest(workspaceId, projectId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No evaluation found"));
    }

    // legacy compatibility
    @PostMapping("/api/insights/schedule-evaluations/actions")
    public EvaluationActionResponse actionLegacy(@Valid @RequestBody EvaluationActionRequest request) {
        return actionV2(request.evaluationId(), request);
    }

    @PostMapping("/api/v2/insights/evaluations/{evaluationId}/actions")
    public EvaluationActionResponse actionV2(@PathVariable String evaluationId,
                                             @Valid @RequestBody EvaluationActionRequest request) {
        if (request.evaluationId() != null && !request.evaluationId().isBlank() && !evaluationId.equals(request.evaluationId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "evaluationId mismatch");
        }
        boolean recorded = historyService.recordAction(evaluationId, request.action(), request.note()).isPresent();
        if (!recorded) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluation not found");
        }
        return new EvaluationActionResponse(
                evaluationId,
                request.action(),
                request.note() == null ? "" : request.note(),
                "recorded"
        );
    }

    private ScheduleEvaluationSnapshot toSnapshot(ScheduleEvaluationRequest request, ScheduleEvaluationResponse response) {
        List<ScheduleRisk> risks = response.topRisks().stream()
                .map(risk -> new ScheduleRisk(
                        risk.type(),
                        risk.summary(),
                        risk.impact(),
                        risk.recommendedActions(),
                        risk.evidence()))
                .toList();
        List<ScheduleAction> actions = response.actions().stream()
                .map(action -> new ScheduleAction(
                        action.actionId(),
                        action.label(),
                        action.status(),
                        action.note()))
                .toList();

        return new ScheduleEvaluationSnapshot(
                response.evaluationId(),
                request.workspaceId(),
                request.projectId(),
                request.sprintId(),
                request.selectedWorkItemId(),
                request.prompt(),
                response.health(),
                risks,
                response.questions(),
                actions,
                response.confidence(),
                response.fallback(),
                response.reason(),
                Instant.now()
        );
    }

    private ScheduleEvaluationResponse toResponse(ScheduleEvaluationSnapshot snapshot) {
        return new ScheduleEvaluationResponse(
                snapshot.evaluationId(),
                snapshot.health(),
                snapshot.topRisks().stream()
                        .map(risk -> new RiskItem(
                                risk.type(),
                                risk.summary(),
                                risk.impact(),
                                risk.recommendedActions(),
                                risk.evidence()))
                        .toList(),
                snapshot.questions(),
                snapshot.actions().stream()
                        .map(action -> new ActionItem(
                                action.actionId(),
                                action.label(),
                                action.status(),
                                action.note()))
                        .toList(),
                snapshot.confidence(),
                snapshot.fallback(),
                normalizeReason(snapshot.reason(), snapshot.fallback())
        );
    }

    private String normalizeReason(String reason, boolean fallback) {
        if (reason == null || reason.isBlank()) {
            return fallback ? "deterministic_fallback" : "llm_success";
        }
        return switch (reason) {
            case "ok" -> "llm_success";
            case "fallback_rules_only" -> "deterministic_fallback";
            default -> reason;
        };
    }

    public record ScheduleEvaluationRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            String sprintId,
            String selectedWorkItemId,
            String prompt,
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

    public record ActionItem(
            String actionId,
            String label,
            String status,
            String note
    ) {
    }

    public record ScheduleEvaluationResponse(
            String evaluationId,
            String health,
            List<RiskItem> topRisks,
            List<String> questions,
            List<ActionItem> actions,
            @Min(0) @Max(1) double confidence,
            boolean fallback,
            String reason
    ) {
    }

    public record EvaluationActionRequest(
            String evaluationId,
            @NotBlank String action,
            String note,
            Map<String, Object> patch
    ) {
    }

    public record EvaluationActionResponse(String evaluationId, String action, String note, String status) {
    }
}
