package com.example.gateway.application.service;

import com.example.gateway.application.port.out.ScheduleEvaluationStore;
import com.example.gateway.domain.schedule.ScheduleAction;
import com.example.gateway.domain.schedule.ScheduleEvaluationSnapshot;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ScheduleEvaluationHistoryService {
    private final ScheduleEvaluationStore store;

    public ScheduleEvaluationHistoryService(ScheduleEvaluationStore store) {
        this.store = store;
    }

    public ScheduleEvaluationSnapshot save(ScheduleEvaluationSnapshot snapshot) {
        ScheduleEvaluationSnapshot normalized = new ScheduleEvaluationSnapshot(
                snapshot.evaluationId(),
                snapshot.workspaceId(),
                snapshot.projectId(),
                snapshot.sprintId(),
                snapshot.selectedWorkItemId(),
                snapshot.prompt(),
                snapshot.health(),
                snapshot.topRisks(),
                snapshot.questions(),
                snapshot.actions(),
                snapshot.confidence(),
                snapshot.fallback(),
                snapshot.reason(),
                snapshot.createdAt() == null ? Instant.now() : snapshot.createdAt()
        );
        return store.save(normalized);
    }

    public Optional<ScheduleEvaluationSnapshot> findLatest(String workspaceId, String projectId) {
        return store.findLatest(workspaceId, projectId);
    }

    public Optional<ScheduleEvaluationSnapshot> recordAction(String evaluationId, String action, String note) {
        Optional<ScheduleEvaluationSnapshot> existing = store.findByEvaluationId(evaluationId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }

        ScheduleEvaluationSnapshot current = existing.get();
        List<ScheduleAction> nextActions = new ArrayList<>(current.actions());
        nextActions.add(new ScheduleAction(action, action, "recorded", note == null ? "" : note));
        ScheduleEvaluationSnapshot updated = current.withActions(nextActions);
        return Optional.of(store.save(updated));
    }
}
