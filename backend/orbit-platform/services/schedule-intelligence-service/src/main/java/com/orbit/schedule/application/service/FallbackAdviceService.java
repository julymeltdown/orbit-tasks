package com.orbit.schedule.application.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class FallbackAdviceService {

    public ScheduleEvaluationService.ScheduleEvaluation fallback(DeterministicRiskEngine.DeterministicResult deterministic,
                                                                 String reason) {
        List<ScheduleEvaluationService.RiskItem> risks = deterministic.risks().stream()
                .map(risk -> new ScheduleEvaluationService.RiskItem(
                        risk.type(),
                        risk.summary(),
                        "Deterministic fallback",
                        List.of("Re-run AI evaluation", "Verify blocker owner"),
                        List.of("fallback:" + reason)))
                .toList();

        return new ScheduleEvaluationService.ScheduleEvaluation(
                deterministic.health(),
                risks,
                List.of("AI response unavailable: " + reason, "Need manual confirmation from team lead"),
                0.45,
                true,
                reason);
    }
}
