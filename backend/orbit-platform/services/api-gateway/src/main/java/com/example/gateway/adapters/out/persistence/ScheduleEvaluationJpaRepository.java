package com.example.gateway.adapters.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleEvaluationJpaRepository extends JpaRepository<ScheduleEvaluationEntity, UUID> {
    Optional<ScheduleEvaluationEntity> findTopByWorkspaceIdAndProjectIdOrderByCreatedAtDesc(String workspaceId, String projectId);

    Optional<ScheduleEvaluationEntity> findByEvaluationId(String evaluationId);
}
