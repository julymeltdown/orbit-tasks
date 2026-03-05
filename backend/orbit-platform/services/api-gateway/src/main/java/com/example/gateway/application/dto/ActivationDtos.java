package com.example.gateway.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public final class ActivationDtos {
    private ActivationDtos() {
    }

    public record ActionLink(String label, String path) {
    }

    public record ActivationStep(
            String stepCode,
            String title,
            String description,
            String status,
            ActionLink primaryAction,
            List<ActionLink> secondaryActions
    ) {
    }

    public record ActivationStateResponse(
            String workspaceId,
            String projectId,
            String userId,
            String activationStage,
            String navigationProfile,
            boolean completed,
            String completionReason,
            List<ActivationStep> checklist,
            String updatedAt
    ) {
    }

    public record ActivationEventRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            @NotBlank String userIdHash,
            @NotBlank String sessionId,
            @NotBlank String eventType,
            @NotBlank String route,
            @Min(0) long elapsedMs,
            Map<String, Object> metadata
    ) {
    }

    public record AcceptedResponse(String status, String traceId) {
    }
}
