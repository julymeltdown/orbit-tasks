package com.example.gateway.application.service;

import com.example.gateway.application.port.out.DsuSuggestionLlmPort;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class DsuSuggestionService {
    private static final int MAX_SUGGESTIONS = 8;

    private final DsuSuggestionLlmPort llmPort;

    public DsuSuggestionService(DsuSuggestionLlmPort llmPort) {
        this.llmPort = llmPort;
    }

    public List<SuggestionDraft> suggest(SuggestionContext context, List<String> backlogWorkItemIds) {
        List<SuggestionDraft> llm = suggestWithLlm(context, backlogWorkItemIds);
        if (!llm.isEmpty()) {
            return llm;
        }
        return suggestWithRules(context.rawText(), backlogWorkItemIds);
    }

    private List<SuggestionDraft> suggestWithLlm(SuggestionContext context, List<String> backlogWorkItemIds) {
        return llmPort.suggest(new DsuSuggestionLlmPort.LlmSuggestionPrompt(
                        context.workspaceId(),
                        context.projectId(),
                        context.sprintId(),
                        context.authorId(),
                        context.rawText(),
                        backlogWorkItemIds))
                .map(response -> response.suggestions().stream()
                        .filter(Objects::nonNull)
                        .map(this::normalizeSuggestion)
                        .filter(Objects::nonNull)
                        .limit(MAX_SUGGESTIONS)
                        .toList())
                .orElse(List.of());
    }

    private SuggestionDraft normalizeSuggestion(DsuSuggestionLlmPort.LlmSuggestionItem item) {
        String targetType = safeText(item.targetType(), "QUESTION");
        String targetId = safeText(item.targetId(), "");
        Map<String, Object> proposedChange = item.proposedChange() == null ? Map.of() : item.proposedChange();
        double confidence = clamp(item.confidence());
        String reason = safeText(item.reason(), "LLM suggestion");
        return new SuggestionDraft(targetType, targetId, proposedChange, confidence, reason);
    }

    private List<SuggestionDraft> suggestWithRules(String rawText, List<String> backlogWorkItemIds) {
        String text = rawText == null ? "" : rawText.toLowerCase();
        List<SuggestionDraft> suggestions = new ArrayList<>();

        if ((text.contains("done") || text.contains("완료")) && !backlogWorkItemIds.isEmpty()) {
            suggestions.add(new SuggestionDraft(
                    "WORK_ITEM_PATCH",
                    backlogWorkItemIds.get(0),
                    Map.of("status", "DONE"),
                    0.84d,
                    "Detected completion signal from DSU text"));
        }

        if ((text.contains("review") || text.contains("검토")) && backlogWorkItemIds.size() > 1) {
            suggestions.add(new SuggestionDraft(
                    "WORK_ITEM_PATCH",
                    backlogWorkItemIds.get(1),
                    Map.of("status", "REVIEW"),
                    0.78d,
                    "Detected review signal from DSU text"));
        }

        if (text.contains("blocked") || text.contains("막힘") || text.contains("승인")) {
            String targetId = backlogWorkItemIds.isEmpty() ? "" : backlogWorkItemIds.get(0);
            suggestions.add(new SuggestionDraft(
                    "WORK_ITEM_PATCH",
                    targetId,
                    Map.of("blockedReason", "Blocker detected from DSU"),
                    0.55d,
                    "Possible blocker phrase found, confirmation required"));
        }

        if (suggestions.isEmpty()) {
            suggestions.add(new SuggestionDraft(
                    "QUESTION",
                    "",
                    Map.of("question", "No actionable change recognized. Please select target work item."),
                    0.42d,
                    "Insufficient confidence"));
        }

        return suggestions.stream().limit(MAX_SUGGESTIONS).toList();
    }

    private String safeText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private double clamp(double confidence) {
        if (Double.isNaN(confidence)) {
            return 0.0d;
        }
        return Math.max(0.0d, Math.min(1.0d, confidence));
    }

    public record SuggestionContext(
            String workspaceId,
            String projectId,
            String sprintId,
            String authorId,
            String rawText
    ) {
    }

    public record SuggestionDraft(
            String targetType,
            String targetId,
            Map<String, Object> proposedChange,
            double confidence,
            String reason
    ) {
    }
}
