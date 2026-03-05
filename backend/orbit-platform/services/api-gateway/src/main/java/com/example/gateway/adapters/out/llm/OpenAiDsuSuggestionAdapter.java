package com.example.gateway.adapters.out.llm;

import com.example.gateway.application.port.out.DsuSuggestionLlmPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OpenAiDsuSuggestionAdapter implements DsuSuggestionLlmPort {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final Duration timeout;
    private final boolean storeResponses;

    public OpenAiDsuSuggestionAdapter(ObjectMapper objectMapper,
                                      @Value("${orbit.ai.openai.base-url:https://api.openai.com}") String baseUrl,
                                      @Value("${orbit.ai.openai.api-key:}") String apiKey,
                                      @Value("${orbit.ai.model:gpt-5.2-pro}") String model,
                                      @Value("${orbit.ai.timeout-ms:45000}") int timeoutMs,
                                      @Value("${orbit.ai.openai.store:false}") boolean storeResponses) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.baseUrl = baseUrl == null ? "https://api.openai.com" : baseUrl;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gpt-5.2-pro" : model;
        this.timeout = Duration.ofMillis(Math.max(timeoutMs, 1000));
        this.storeResponses = storeResponses;
    }

    @Override
    public Optional<LlmSuggestionResponse> suggest(LlmSuggestionPrompt prompt) {
        if (apiKey.isBlank()) {
            return Optional.empty();
        }

        try {
            URI uri = URI.create(baseUrl.endsWith("/") ? baseUrl + "v1/responses" : baseUrl + "/v1/responses");
            String payload = objectMapper.writeValueAsString(buildRequest(prompt));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(timeout)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String output = extractOutputText(root);
            if (output.isBlank()) {
                return Optional.empty();
            }
            String jsonPayload = stripMarkdownFence(output);
            JsonNode parsed = objectMapper.readTree(jsonPayload);
            JsonNode suggestionsNode = parsed.get("suggestions");
            if (suggestionsNode == null || !suggestionsNode.isArray()) {
                return Optional.empty();
            }

            List<LlmSuggestionItem> items = new ArrayList<>();
            for (JsonNode node : suggestionsNode) {
                String targetType = node.path("targetType").asText("QUESTION");
                String targetId = node.path("targetId").asText("");
                double confidence = node.path("confidence").asDouble(0.0d);
                String reason = node.path("reason").asText("LLM suggestion");
                Map<String, Object> proposedChange = parseMap(node.get("proposedChange"));
                items.add(new LlmSuggestionItem(targetType, targetId, proposedChange, confidence, reason));
            }

            if (items.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(new LlmSuggestionResponse(items, model));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Map<String, Object> buildRequest(LlmSuggestionPrompt prompt) {
        String systemPrompt = """
                You are an agile DSU parser for task progress updates.
                Return ONLY JSON with this shape:
                {"suggestions":[{"targetType":"WORK_ITEM_PATCH|QUESTION","targetId":"string","proposedChange":{},"confidence":0.0,"reason":"string"}]}
                Never mutate data, only propose draft changes.
                Prefer WORK_ITEM_PATCH when DSU clearly maps to backlog item IDs.
                """;

        Map<String, Object> promptContext = new LinkedHashMap<>();
        promptContext.put("workspaceId", prompt.workspaceId());
        promptContext.put("projectId", prompt.projectId());
        promptContext.put("sprintId", prompt.sprintId());
        promptContext.put("authorId", prompt.authorId());
        promptContext.put("rawText", prompt.rawText());
        promptContext.put("backlogWorkItemIds", prompt.backlogWorkItemIds());

        String userPrompt;
        try {
            userPrompt = "Parse this DSU and propose draft updates only.\nContext:\n"
                    + objectMapper.writeValueAsString(promptContext);
        } catch (Exception e) {
            userPrompt = "Parse DSU and return structured suggestions.";
        }

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("model", model);
        request.put("store", storeResponses);
        request.put("input", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));
        request.put("max_output_tokens", 1200);
        request.put("reasoning", Map.of("effort", "medium"));
        return request;
    }

    private String extractOutputText(JsonNode response) {
        JsonNode directText = response.get("output_text");
        if (directText != null && directText.isTextual() && !directText.asText().isBlank()) {
            return directText.asText();
        }

        JsonNode output = response.get("output");
        if (output != null && output.isArray()) {
            StringBuilder aggregated = new StringBuilder();
            for (JsonNode item : output) {
                JsonNode content = item.get("content");
                if (content != null && content.isArray()) {
                    for (JsonNode chunk : content) {
                        JsonNode textNode = chunk.get("text");
                        if (textNode != null && textNode.isTextual() && !textNode.asText().isBlank()) {
                            if (aggregated.length() > 0) {
                                aggregated.append('\n');
                            }
                            aggregated.append(textNode.asText());
                        }
                    }
                }
            }
            return aggregated.toString();
        }
        return "";
    }

    private String stripMarkdownFence(String rawText) {
        String trimmed = rawText == null ? "" : rawText.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        int firstLineBreak = trimmed.indexOf('\n');
        if (firstLineBreak < 0) {
            return trimmed.replace("```", "").trim();
        }
        String withoutHeader = trimmed.substring(firstLineBreak + 1);
        int trailingFence = withoutHeader.lastIndexOf("```");
        if (trailingFence >= 0) {
            return withoutHeader.substring(0, trailingFence).trim();
        }
        return withoutHeader.trim();
    }

    private Map<String, Object> parseMap(JsonNode node) {
        if (node == null || node.isNull()) {
            return Map.of();
        }
        try {
            return objectMapper.convertValue(node, MAP_TYPE);
        } catch (IllegalArgumentException ignored) {
            return Map.of();
        }
    }
}
