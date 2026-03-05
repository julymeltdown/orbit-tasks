package com.example.gateway.adapters.out.persistence;

import com.example.gateway.application.port.out.ScheduleEvaluationStore;
import com.example.gateway.domain.schedule.ScheduleAction;
import com.example.gateway.domain.schedule.ScheduleEvaluationSnapshot;
import com.example.gateway.domain.schedule.ScheduleRisk;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ScheduleEvaluationStoreAdapter implements ScheduleEvaluationStore {
    private static final TypeReference<List<ScheduleRisk>> RISK_LIST = new TypeReference<>() {
    };
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };
    private static final TypeReference<List<ScheduleAction>> ACTION_LIST = new TypeReference<>() {
    };

    private final ScheduleEvaluationJpaRepository repository;
    private final ObjectMapper objectMapper;

    public ScheduleEvaluationStoreAdapter(ScheduleEvaluationJpaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public ScheduleEvaluationSnapshot save(ScheduleEvaluationSnapshot snapshot) {
        ScheduleEvaluationEntity entity = repository.findByEvaluationId(snapshot.evaluationId())
                .orElseGet(ScheduleEvaluationEntity::new);

        if (entity.getId() == null) {
            entity.setId(UUID.randomUUID());
            entity.setCreatedAt(snapshot.createdAt() == null ? Instant.now() : snapshot.createdAt());
        }

        entity.setEvaluationId(snapshot.evaluationId());
        entity.setWorkspaceId(snapshot.workspaceId());
        entity.setProjectId(snapshot.projectId());
        entity.setSprintId(snapshot.sprintId());
        entity.setSelectedWorkItemId(snapshot.selectedWorkItemId());
        entity.setPrompt(snapshot.prompt());
        entity.setHealth(snapshot.health());
        entity.setTopRisksJson(writeJson(snapshot.topRisks()));
        entity.setQuestionsJson(writeJson(snapshot.questions()));
        entity.setActionsJson(writeJson(snapshot.actions()));
        entity.setConfidence(snapshot.confidence());
        entity.setFallback(snapshot.fallback());
        entity.setReason(snapshot.reason());

        ScheduleEvaluationEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<ScheduleEvaluationSnapshot> findLatest(String workspaceId, String projectId) {
        return repository.findTopByWorkspaceIdAndProjectIdOrderByCreatedAtDesc(workspaceId, projectId)
                .map(this::toDomain);
    }

    @Override
    public Optional<ScheduleEvaluationSnapshot> findByEvaluationId(String evaluationId) {
        return repository.findByEvaluationId(evaluationId).map(this::toDomain);
    }

    private ScheduleEvaluationSnapshot toDomain(ScheduleEvaluationEntity entity) {
        return new ScheduleEvaluationSnapshot(
                entity.getEvaluationId(),
                entity.getWorkspaceId(),
                entity.getProjectId(),
                entity.getSprintId(),
                entity.getSelectedWorkItemId(),
                entity.getPrompt(),
                entity.getHealth(),
                readJson(entity.getTopRisksJson(), RISK_LIST),
                readJson(entity.getQuestionsJson(), STRING_LIST),
                readJson(entity.getActionsJson(), ACTION_LIST),
                entity.getConfidence(),
                entity.isFallback(),
                entity.getReason(),
                entity.getCreatedAt()
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize schedule evaluation payload", e);
        }
    }

    private <T> T readJson(String payload, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(payload, typeRef);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot parse persisted schedule evaluation payload", e);
        }
    }
}
