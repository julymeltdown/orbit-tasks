package com.orbit.schedule.adapters.out.llm;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OpenAiEvaluationClient {

    public LlmResult evaluate(Map<String, Object> promptContext, RedactionPolicy redactionPolicy) {
        // Placeholder adapter used in this implementation phase.
        // Real API call path should enforce store:false, rate limits, and retry policy.
        boolean blocked = String.valueOf(promptContext.getOrDefault("blockedCount", "0")).equals("1");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("health", blocked ? "at_risk" : "warning");
        payload.put("top_risks", List.of(Map.of(
                "type", blocked ? "external_dependency" : "capacity_overload",
                "summary", blocked ? "Infra approval pending" : "Capacity margin below threshold",
                "impact", "Release milestone can slip",
                "recommended_actions", List.of("Secure owner ETA", "Prepare plan B"),
                "evidence", List.of("DSU-RECENT", "WORKITEM-ANCHOR"))));
        payload.put("questions", List.of("Can scope be reduced this sprint?", "Who owns blocker resolution?"));
        payload.put("confidence", blocked ? 0.72 : 0.61);

        return new LlmResult(payload, true, redactionPolicy.mode());
    }

    public record RedactionPolicy(String mode, boolean removePii) {
    }

    public record LlmResult(Map<String, Object> payload, boolean structured, String redactionMode) {
    }
}
