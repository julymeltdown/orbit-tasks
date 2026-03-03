package com.orbit.schedule.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.orbit.schedule.adapters.out.llm.OpenAiEvaluationClient;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduleEvaluationServiceTest {

    @Mock
    private OpenAiEvaluationClient aiClient;

    private ScheduleEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new ScheduleEvaluationService(
                new DeterministicRiskEngine(),
                new EvaluationSchemaValidator(),
                aiClient,
                new FallbackAdviceService(),
                0.55
        );
    }

    @Test
    void evaluate_returnsFallback_whenLlmThrows() {
        when(aiClient.evaluate(org.mockito.ArgumentMatchers.anyMap(), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new IllegalStateException("openai_rate_limited"));

        ScheduleEvaluationService.ScheduleEvaluation result = service.evaluate(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new DeterministicRiskEngine.Metrics(21, 18, 1, 1),
                false
        );

        assertThat(result.fallback()).isTrue();
        assertThat(result.reason()).startsWith("llm_unavailable:");
    }

    @Test
    void evaluate_returnsNormalResponse_whenConfidenceIsEnough() {
        Map<String, Object> payload = Map.of(
                "health", "warning",
                "top_risks", List.of(Map.of(
                        "type", "capacity_overload",
                        "summary", "Remaining scope exceeds capacity",
                        "impact", "Sprint goal at risk",
                        "recommended_actions", List.of("Reduce scope", "Escalate blocker"),
                        "evidence", List.of("WORKITEM-1"))),
                "questions", List.of("Can scope be reduced?"),
                "confidence", 0.88
        );
        when(aiClient.evaluate(org.mockito.ArgumentMatchers.anyMap(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new OpenAiEvaluationClient.LlmResult(payload, true, "mask-pii"));

        ScheduleEvaluationService.ScheduleEvaluation result = service.evaluate(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                new DeterministicRiskEngine.Metrics(10, 20, 0, 1),
                false
        );

        assertThat(result.fallback()).isFalse();
        assertThat(result.reason()).isEqualTo("ok");
        assertThat(result.confidence()).isEqualTo(0.88);
        assertThat(result.topRisks()).hasSize(1);
    }

    @Test
    void evaluate_returnsFallback_whenConfidenceIsLow() {
        Map<String, Object> payload = Map.of(
                "health", "warning",
                "top_risks", List.of(Map.of(
                        "type", "capacity_overload",
                        "summary", "Remaining scope exceeds capacity",
                        "impact", "Sprint goal at risk",
                        "recommended_actions", List.of("Reduce scope"),
                        "evidence", List.of("WORKITEM-1"))),
                "questions", List.of("Can scope be reduced?"),
                "confidence", 0.22
        );
        when(aiClient.evaluate(org.mockito.ArgumentMatchers.anyMap(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new OpenAiEvaluationClient.LlmResult(payload, true, "mask-pii"));

        ScheduleEvaluationService.ScheduleEvaluation result = service.evaluate(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new DeterministicRiskEngine.Metrics(10, 20, 0, 0),
                false
        );

        assertThat(result.fallback()).isTrue();
        assertThat(result.reason()).isEqualTo("low_confidence");
    }
}
