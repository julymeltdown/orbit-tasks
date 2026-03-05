package com.example.gateway.domain.schedule;

import java.time.Instant;
import java.util.List;

public record ScheduleEvaluationSnapshot(
        String evaluationId,
        String workspaceId,
        String projectId,
        String sprintId,
        String selectedWorkItemId,
        String prompt,
        String health,
        List<ScheduleRisk> topRisks,
        List<String> questions,
        List<ScheduleAction> actions,
        double confidence,
        boolean fallback,
        String reason,
        Instant createdAt
) {
    public ScheduleEvaluationSnapshot withActions(List<ScheduleAction> nextActions) {
        return new ScheduleEvaluationSnapshot(
                evaluationId,
                workspaceId,
                projectId,
                sprintId,
                selectedWorkItemId,
                prompt,
                health,
                topRisks,
                questions,
                nextActions,
                confidence,
                fallback,
                reason,
                createdAt
        );
    }
}
