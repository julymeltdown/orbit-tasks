package com.example.gateway.application.port.out;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface DsuSuggestionLlmPort {
    Optional<LlmSuggestionResponse> suggest(LlmSuggestionPrompt prompt);

    record LlmSuggestionPrompt(
            String workspaceId,
            String projectId,
            String sprintId,
            String authorId,
            String rawText,
            List<String> backlogWorkItemIds
    ) {
    }

    record LlmSuggestionResponse(List<LlmSuggestionItem> suggestions, String model) {
    }

    record LlmSuggestionItem(
            String targetType,
            String targetId,
            Map<String, Object> proposedChange,
            double confidence,
            String reason
    ) {
    }
}
