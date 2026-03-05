package com.example.gateway.application.port.out;

import com.example.gateway.domain.schedule.ScheduleEvaluationSnapshot;
import java.util.Optional;

public interface ScheduleEvaluationStore {
    ScheduleEvaluationSnapshot save(ScheduleEvaluationSnapshot snapshot);

    Optional<ScheduleEvaluationSnapshot> findLatest(String workspaceId, String projectId);

    Optional<ScheduleEvaluationSnapshot> findByEvaluationId(String evaluationId);
}
