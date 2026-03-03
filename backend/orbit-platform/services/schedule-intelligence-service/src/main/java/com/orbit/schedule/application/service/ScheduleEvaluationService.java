package com.orbit.schedule.application.service;

import com.orbit.schedule.adapters.out.llm.OpenAiEvaluationClient;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ScheduleEvaluationService {
    private final DeterministicRiskEngine riskEngine;
    private final EvaluationSchemaValidator schemaValidator;
    private final OpenAiEvaluationClient aiClient;
    private final FallbackAdviceService fallbackAdviceService;

    public ScheduleEvaluationService(DeterministicRiskEngine riskEngine,
                                     EvaluationSchemaValidator schemaValidator,
                                     OpenAiEvaluationClient aiClient,
                                     FallbackAdviceService fallbackAdviceService) {
        this.riskEngine = riskEngine;
        this.schemaValidator = schemaValidator;
        this.aiClient = aiClient;
        this.fallbackAdviceService = fallbackAdviceService;
    }

    public ScheduleEvaluation evaluate(UUID workspaceId,
                                       UUID projectId,
                                       UUID sprintId,
                                       DeterministicRiskEngine.Metrics metrics,
                                       boolean simulateAiFailure) {
        DeterministicRiskEngine.DeterministicResult deterministic = riskEngine.evaluate(metrics);
        if (simulateAiFailure) {
            return fallbackAdviceService.fallback(deterministic, "simulated_failure");
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("workspaceId", workspaceId.toString());
        context.put("projectId", projectId.toString());
        context.put("sprintId", sprintId == null ? "" : sprintId.toString());
        context.put("deterministicHealth", deterministic.health());
        context.put("deterministicScore", deterministic.score());
        context.put("blockedCount", metrics.blockedCount());
        context.put("atRiskCount", metrics.atRiskCount());

        OpenAiEvaluationClient.LlmResult aiResult = aiClient.evaluate(
                context,
                new OpenAiEvaluationClient.RedactionPolicy("mask-pii", true));

        EvaluationSchemaValidator.ValidationResult validation = schemaValidator.validate(aiResult.payload());
        if (!validation.valid()) {
            return fallbackAdviceService.fallback(deterministic, String.join(",", validation.errors()));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topRisks = (List<Map<String, Object>>) aiResult.payload().get("top_risks");
        List<RiskItem> risks = topRisks.stream()
                .map(item -> new RiskItem(
                        String.valueOf(item.get("type")),
                        String.valueOf(item.get("summary")),
                        String.valueOf(item.get("impact")),
                        castStringList(item.get("recommended_actions")),
                        castStringList(item.get("evidence"))))
                .toList();

        @SuppressWarnings("unchecked")
        List<String> questions = (List<String>) aiResult.payload().get("questions");
        double confidence = ((Number) aiResult.payload().get("confidence")).doubleValue();

        if (confidence < 0.55) {
            return fallbackAdviceService.fallback(deterministic, "low_confidence");
        }

        return new ScheduleEvaluation(
                String.valueOf(aiResult.payload().get("health")),
                risks,
                questions,
                confidence,
                false,
                "ok");
    }

    private List<String> castStringList(Object candidate) {
        if (candidate instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public record ScheduleEvaluation(
            String health,
            List<RiskItem> topRisks,
            List<String> questions,
            double confidence,
            boolean fallback,
            String reason
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
}
