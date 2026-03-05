package com.example.gateway.application.service;

import com.example.gateway.application.port.out.DsuSuggestionLlmPort;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DsuSuggestionServiceTest {
    @Test
    void usesLlmSuggestionsWhenAvailable() {
        DsuSuggestionLlmPort llmPort = prompt -> Optional.of(new DsuSuggestionLlmPort.LlmSuggestionResponse(
                List.of(new DsuSuggestionLlmPort.LlmSuggestionItem(
                        "WORK_ITEM_PATCH",
                        "item-1",
                        Map.of("status", "DONE"),
                        1.4d,
                        "LLM mapped completion"
                )),
                "gpt-5.2-pro"
        ));
        DsuSuggestionService service = new DsuSuggestionService(llmPort);

        List<DsuSuggestionService.SuggestionDraft> suggestions = service.suggest(
                new DsuSuggestionService.SuggestionContext("ws", "proj", "sprint", "user", "done today"),
                List.of("item-a", "item-b"));

        assertEquals(1, suggestions.size());
        assertEquals("WORK_ITEM_PATCH", suggestions.get(0).targetType());
        assertEquals("item-1", suggestions.get(0).targetId());
        assertEquals(1.0d, suggestions.get(0).confidence());
        assertEquals("DONE", suggestions.get(0).proposedChange().get("status"));
    }

    @Test
    void fallsBackToRulesWhenLlmUnavailable() {
        DsuSuggestionService service = new DsuSuggestionService(prompt -> Optional.empty());

        List<DsuSuggestionService.SuggestionDraft> suggestions = service.suggest(
                new DsuSuggestionService.SuggestionContext("ws", "proj", "sprint", "user", "오늘 완료했고 검토도 보냈습니다"),
                List.of("item-a", "item-b"));

        assertFalse(suggestions.isEmpty());
        assertTrue(suggestions.stream().anyMatch(item -> "WORK_ITEM_PATCH".equals(item.targetType())));
        assertTrue(suggestions.stream().anyMatch(item -> "Detected completion signal from DSU text".equals(item.reason())));
    }

    @Test
    void returnsQuestionSuggestionWhenNoSignal() {
        DsuSuggestionService service = new DsuSuggestionService(prompt -> Optional.empty());

        List<DsuSuggestionService.SuggestionDraft> suggestions = service.suggest(
                new DsuSuggestionService.SuggestionContext("ws", "proj", "sprint", "user", "sync only"),
                List.of());

        assertEquals(1, suggestions.size());
        assertEquals("QUESTION", suggestions.get(0).targetType());
        assertTrue(suggestions.get(0).confidence() < 0.6d);
    }
}
