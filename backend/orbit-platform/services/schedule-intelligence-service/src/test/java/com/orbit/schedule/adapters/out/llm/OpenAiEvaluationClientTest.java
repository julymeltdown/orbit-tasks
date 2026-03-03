package com.orbit.schedule.adapters.out.llm;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

class OpenAiEvaluationClientTest {

    private final OpenAiEvaluationClient client = new OpenAiEvaluationClient(
            WebClient.builder(),
            new ObjectMapper(),
            "http://localhost:9999",
            "test-key",
            "gpt-5.2-pro",
            5_000,
            false
    );

    @Test
    void parsePayloadFromResponse_readsOutputTextField() throws Exception {
        String response = """
                {
                  "output_text": "{\\"health\\":\\"warning\\",\\"top_risks\\":[],\\"questions\\":[],\\"confidence\\":0.73}"
                }
                """;

        Map<String, Object> parsed = client.parsePayloadFromResponse(new ObjectMapper().readTree(response));

        assertThat(parsed.get("health")).isEqualTo("warning");
        assertThat(parsed.get("confidence")).isEqualTo(0.73);
    }

    @Test
    void parsePayloadFromResponse_readsNestedOutputContent() throws Exception {
        String response = """
                {
                  "output": [
                    {
                      "type": "message",
                      "content": [
                        {
                          "type": "output_text",
                          "text": "{\\"health\\":\\"at_risk\\",\\"top_risks\\":[{\\"type\\":\\"blocked\\",\\"summary\\":\\"Infra delay\\",\\"impact\\":\\"milestone slip\\",\\"recommended_actions\\":[\\"escalate\\"],\\"evidence\\":[\\"DSU-1\\"]}],\\"questions\\":[\\"Who owns infra approval?\\"],\\"confidence\\":0.66}"
                        }
                      ]
                    }
                  ]
                }
                """;

        Map<String, Object> parsed = client.parsePayloadFromResponse(new ObjectMapper().readTree(response));

        assertThat(parsed.get("health")).isEqualTo("at_risk");
        assertThat(parsed.get("questions")).isInstanceOfAny(java.util.List.class);
    }

    @Test
    void stripMarkdownFence_removesCodeFence() {
        String fenced = """
                ```json
                {"health":"healthy","top_risks":[],"questions":[],"confidence":0.91}
                ```
                """;

        String cleaned = client.stripMarkdownFence(fenced);

        assertThat(cleaned).isEqualTo("{\"health\":\"healthy\",\"top_risks\":[],\"questions\":[],\"confidence\":0.91}");
    }
}
