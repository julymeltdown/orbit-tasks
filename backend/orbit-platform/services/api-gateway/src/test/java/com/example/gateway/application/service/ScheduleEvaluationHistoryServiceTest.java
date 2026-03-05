package com.example.gateway.application.service;

import com.example.gateway.application.port.out.ScheduleEvaluationStore;
import com.example.gateway.domain.schedule.ScheduleAction;
import com.example.gateway.domain.schedule.ScheduleEvaluationSnapshot;
import com.example.gateway.domain.schedule.ScheduleRisk;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScheduleEvaluationHistoryServiceTest {
    @Test
    void savesAndReadsLatestByWorkspaceAndProject() {
        InMemoryStore store = new InMemoryStore();
        ScheduleEvaluationHistoryService service = new ScheduleEvaluationHistoryService(store);

        service.save(snapshot("eval-1", "ws-1", "proj-1", Instant.parse("2026-03-05T00:00:00Z")));
        service.save(snapshot("eval-2", "ws-1", "proj-1", Instant.parse("2026-03-05T01:00:00Z")));

        Optional<ScheduleEvaluationSnapshot> latest = service.findLatest("ws-1", "proj-1");
        assertTrue(latest.isPresent());
        assertEquals("eval-2", latest.get().evaluationId());
    }

    @Test
    void recordsActionIntoSnapshot() {
        InMemoryStore store = new InMemoryStore();
        ScheduleEvaluationHistoryService service = new ScheduleEvaluationHistoryService(store);
        service.save(snapshot("eval-3", "ws-2", "proj-2", Instant.parse("2026-03-05T02:00:00Z")));

        Optional<ScheduleEvaluationSnapshot> updated = service.recordAction("eval-3", "accept", "from shell");
        assertTrue(updated.isPresent());
        assertEquals(2, updated.get().actions().size());
        assertEquals("accept", updated.get().actions().get(1).actionId());
    }

    private ScheduleEvaluationSnapshot snapshot(String id, String workspaceId, String projectId, Instant createdAt) {
        return new ScheduleEvaluationSnapshot(
                id,
                workspaceId,
                projectId,
                null,
                null,
                "prompt",
                "healthy",
                List.of(new ScheduleRisk("flow", "ok", "none", List.of("monitor"), List.of("WORKGRAPH"))),
                List.of("question"),
                List.of(new ScheduleAction("ACTION_SCOPE_REBALANCE", "Rebalance", "draft", null)),
                0.8,
                false,
                "ok",
                createdAt
        );
    }

    private static final class InMemoryStore implements ScheduleEvaluationStore {
        private final List<ScheduleEvaluationSnapshot> snapshots = new ArrayList<>();

        @Override
        public ScheduleEvaluationSnapshot save(ScheduleEvaluationSnapshot snapshot) {
            snapshots.removeIf(it -> it.evaluationId().equals(snapshot.evaluationId()));
            snapshots.add(snapshot);
            return snapshot;
        }

        @Override
        public Optional<ScheduleEvaluationSnapshot> findLatest(String workspaceId, String projectId) {
            return snapshots.stream()
                    .filter(it -> it.workspaceId().equals(workspaceId))
                    .filter(it -> it.projectId().equals(projectId))
                    .max(Comparator.comparing(ScheduleEvaluationSnapshot::createdAt));
        }

        @Override
        public Optional<ScheduleEvaluationSnapshot> findByEvaluationId(String evaluationId) {
            return snapshots.stream().filter(it -> it.evaluationId().equals(evaluationId)).findFirst();
        }
    }
}
