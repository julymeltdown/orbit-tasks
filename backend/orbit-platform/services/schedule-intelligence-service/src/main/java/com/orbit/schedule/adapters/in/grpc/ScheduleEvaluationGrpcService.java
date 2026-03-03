package com.orbit.schedule.adapters.in.grpc;

import com.orbit.schedule.application.service.DeterministicRiskEngine;
import com.orbit.schedule.application.service.ScheduleEvaluationService;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class ScheduleEvaluationGrpcService {
    private final ScheduleEvaluationService evaluationService;

    public ScheduleEvaluationGrpcService(ScheduleEvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    public ScheduleEvaluationService.ScheduleEvaluation evaluate(String workspaceId,
                                                                  String projectId,
                                                                  String sprintId,
                                                                  int remainingSp,
                                                                  int availableSp,
                                                                  int blockedCount,
                                                                  int atRiskCount,
                                                                  boolean simulateAiFailure) {
        return evaluationService.evaluate(
                UUID.fromString(workspaceId),
                UUID.fromString(projectId),
                sprintId == null || sprintId.isBlank() ? null : UUID.fromString(sprintId),
                new DeterministicRiskEngine.Metrics(remainingSp, availableSp, blockedCount, atRiskCount),
                simulateAiFailure);
    }
}
