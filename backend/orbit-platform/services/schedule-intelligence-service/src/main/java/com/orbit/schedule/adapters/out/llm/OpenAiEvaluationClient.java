package com.orbit.schedule.adapters.out.llm;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class OpenAiEvaluationClient {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };
    private static final String RESPONSES_ENDPOINT = "/v1/responses";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final int timeoutMs;
    private final boolean storeResponses;

    public OpenAiEvaluationClient(WebClient.Builder webClientBuilder,
                                  ObjectMapper objectMapper,
                                  @Value("${orbit.ai.openai.base-url:https://api.openai.com}") String baseUrl,
                                  @Value("${orbit.ai.openai.api-key:}") String apiKey,
                                  @Value("${orbit.ai.model:gpt-5.2-pro}") String model,
                                  @Value("${orbit.ai.timeout-ms:45000}") int timeoutMs,
                                  @Value("${orbit.ai.openai.store:false}") boolean storeResponses) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.timeoutMs = timeoutMs;
        this.storeResponses = storeResponses;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + this.apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public LlmResult evaluate(Map<String, Object> promptContext, RedactionPolicy redactionPolicy) {
        if (isBlankBearerToken()) {
            throw new IllegalStateException("openai_api_key_missing");
        }
        try {
            JsonNode response = webClient.post()
                    .uri(RESPONSES_ENDPOINT)
                    .bodyValue(buildRequest(promptContext, redactionPolicy))
                    .retrieve()
                    .onStatus(status -> status.value() == 429, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .map(body -> new IllegalStateException("openai_rate_limited:" + abbreviate(body))))
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .map(body -> new IllegalStateException(
                                            "openai_http_" + clientResponse.statusCode().value() + ":" + abbreviate(body))))
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .onErrorResume(error -> Mono.error(new IllegalStateException("openai_call_failed", error)))
                    .block();

            Map<String, Object> payload = parsePayloadFromResponse(response);
            return new LlmResult(payload, true, redactionPolicy.mode());
        } catch (RuntimeException runtimeException) {
            throw runtimeException;
        } catch (Exception exception) {
            throw new IllegalStateException("openai_parse_failed", exception);
        }
    }

    private Map<String, Object> buildRequest(Map<String, Object> promptContext, RedactionPolicy redactionPolicy) {
        String promptContextJson = toJson(promptContext);
        String systemPrompt = """
                You are an enterprise schedule coach.
                Return ONLY a valid JSON object.
                The JSON object must include:
                - health: one of [healthy, warning, at_risk]
                - top_risks: array of objects with fields [type, summary, impact, recommended_actions, evidence]
                - questions: array of strings
                - confidence: number between 0 and 1
                Never include markdown, prose, or code fences.
                """;
        String userPrompt = """
                Evaluate schedule health using the context below.
                Use redaction policy: %s (removePii=%s).
                Context JSON:
                %s
                """.formatted(redactionPolicy.mode(), redactionPolicy.removePii(), promptContextJson);

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("model", model);
        request.put("store", storeResponses);
        request.put("input", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));
        request.put("reasoning", Map.of("effort", "high"));
        request.put("max_output_tokens", 1800);
        return request;
    }

    Map<String, Object> parsePayloadFromResponse(JsonNode response) throws Exception {
        if (response == null || response.isNull()) {
            throw new IllegalStateException("openai_response_empty");
        }
        String rawText = extractOutputText(response);
        if (rawText.isBlank()) {
            throw new IllegalStateException("openai_output_empty");
        }
        String cleanJson = stripMarkdownFence(rawText);
        return objectMapper.readValue(cleanJson, MAP_TYPE);
    }

    String extractOutputText(JsonNode response) {
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

    String stripMarkdownFence(String rawText) {
        String trimmed = rawText.trim();
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

    private String toJson(Map<String, Object> context) {
        try {
            return objectMapper.writeValueAsString(context == null ? Map.of() : context);
        } catch (Exception e) {
            return "{}";
        }
    }

    private boolean isBlankBearerToken() {
        return apiKey.isEmpty();
    }

    private String abbreviate(String body) {
        if (body == null || body.isBlank()) {
            return "";
        }
        int max = 400;
        return body.length() <= max ? body : body.substring(0, max);
    }

    public record RedactionPolicy(String mode, boolean removePii) {
    }

    public record LlmResult(Map<String, Object> payload, boolean structured, String redactionMode) {
    }
}
