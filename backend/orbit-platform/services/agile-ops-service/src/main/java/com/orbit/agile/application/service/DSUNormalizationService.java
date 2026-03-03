package com.orbit.agile.application.service;

import com.orbit.agile.domain.DSUEntry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DSUNormalizationService {
    private static final String[] BLOCKER_KEYWORDS = {
            "blocked", "stuck", "대기", "의존", "승인", "blocker"
    };

    public DSUEntry normalize(UUID workspaceId, UUID sprintId, String authorId, String rawText) {
        String text = rawText == null ? "" : rawText.trim();
        if (text.isBlank()) {
            throw new IllegalArgumentException("DSU text is required");
        }

        List<DSUEntry.Blocker> blockers = new ArrayList<>();
        String lower = text.toLowerCase(Locale.ROOT);
        for (String keyword : BLOCKER_KEYWORDS) {
            if (lower.contains(keyword)) {
                blockers.add(new DSUEntry.Blocker(
                        "Detected blocker keyword: " + keyword,
                        guessOwnerTeam(lower),
                        guessUrgency(lower)));
                break;
            }
        }

        Map<String, Object> structured = new HashMap<>();
        structured.put("sentences", splitSentences(text));
        structured.put("statusSignal", blockers.isEmpty() ? "on_track" : "blocked");
        structured.put("hasAsk", lower.contains("help") || lower.contains("지원"));

        return new DSUEntry(
                UUID.randomUUID(),
                workspaceId,
                sprintId,
                authorId,
                text,
                structured,
                blockers,
                java.time.Instant.now());
    }

    private static List<String> splitSentences(String raw) {
        String[] chunks = raw.split("[\\n\\.]");
        List<String> result = new ArrayList<>();
        for (String chunk : chunks) {
            String trimmed = chunk.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    private static String guessOwnerTeam(String lowerText) {
        if (lowerText.contains("infra") || lowerText.contains("인프라")) {
            return "infra";
        }
        if (lowerText.contains("qa")) {
            return "qa";
        }
        return "delivery";
    }

    private static String guessUrgency(String lowerText) {
        if (lowerText.contains("release") || lowerText.contains("critical") || lowerText.contains("긴급")) {
            return "high";
        }
        return "medium";
    }
}
