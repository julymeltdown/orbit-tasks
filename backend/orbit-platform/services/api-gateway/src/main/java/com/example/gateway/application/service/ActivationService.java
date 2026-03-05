package com.example.gateway.application.service;

import com.example.gateway.application.dto.ActivationDtos;
import com.example.gateway.application.port.out.ActivationEventSink;
import com.example.gateway.domain.activation.ActivationEventRecord;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;

@Service
public class ActivationService {
    private final ActivationEventSink eventSink;
    private final Clock clock;
    private final ConcurrentMap<ScopeKey, ActivationStateModel> states = new ConcurrentHashMap<>();

    public ActivationService(ActivationEventSink eventSink, Clock clock) {
        this.eventSink = eventSink;
        this.clock = clock;
    }

    public ActivationDtos.ActivationStateResponse getState(String workspaceId, String projectId, String userId) {
        ScopeKey key = new ScopeKey(workspaceId, projectId, userId);
        ActivationStateModel state = states.computeIfAbsent(key, ignored -> ActivationStateModel.create(workspaceId, projectId, userId, now()));
        return toResponse(state);
    }

    public ActivationDtos.ActivationStateResponse recordEvent(String workspaceId, String projectId,
                                                              ActivationDtos.ActivationEventRequest event) {
        ScopeKey key = new ScopeKey(workspaceId, projectId, event.userIdHash());
        ActivationStateModel updated = states.compute(key, (ignored, current) -> {
            ActivationStateModel base = current == null
                    ? ActivationStateModel.create(workspaceId, projectId, event.userIdHash(), now())
                    : current;
            return applyEvent(base, event);
        });

        eventSink.record(new ActivationEventRecord(
                UUID.randomUUID().toString(),
                workspaceId,
                projectId,
                event.userIdHash(),
                event.sessionId(),
                event.eventType(),
                event.route(),
                event.elapsedMs(),
                event.metadata() == null ? Map.of() : event.metadata(),
                now()
        ));
        return toResponse(updated);
    }

    private ActivationStateModel applyEvent(ActivationStateModel state, ActivationDtos.ActivationEventRequest event) {
        Instant recordedAt = now();
        ActivationStateModel next = state.withUpdatedAt(recordedAt);

        switch (event.eventType()) {
            case "FIRST_TASK_CREATED" -> next = next.withFirstTaskCreatedAt(recordedAt);
            case "BOARD_FIRST_INTERACTION" -> next = next.withBoardInteractedAt(recordedAt);
            case "SPRINT_ENTERED" -> next = next.withSprintEnteredAt(recordedAt);
            case "INSIGHT_EVALUATION_STARTED" -> next = next.withInsightEvaluationStartedAt(recordedAt);
            case "INSIGHT_EVALUATION_COMPLETED" -> next = next.withInsightEvaluationCompletedAt(recordedAt);
            case "EMPTY_STATE_ACTION_CLICKED" -> {
                if (event.metadata() != null && "INBOX".equals(String.valueOf(event.metadata().get("scope")))) {
                    next = next.withInboxTriagedAt(recordedAt);
                }
            }
            default -> {
                // no-op for view loaded / CTA clicked and unknown events
            }
        }

        return next.recomputeStage();
    }

    private ActivationDtos.ActivationStateResponse toResponse(ActivationStateModel state) {
        return new ActivationDtos.ActivationStateResponse(
                state.workspaceId(),
                state.projectId(),
                state.userId(),
                state.activationStage(),
                state.navigationProfile(),
                state.completed(),
                state.completionReason(),
                buildChecklist(state),
                state.updatedAt().toString()
        );
    }

    private List<ActivationDtos.ActivationStep> buildChecklist(ActivationStateModel state) {
        boolean createdTask = state.firstTaskCreatedAt() != null;
        boolean boardOpened = state.boardInteractedAt() != null;
        boolean sprintEntered = state.sprintEnteredAt() != null;
        boolean insightStarted = state.insightEvaluationStartedAt() != null;
        boolean inboxTriaged = state.inboxTriagedAt() != null;

        List<ActivationDtos.ActivationStep> checklist = new ArrayList<>();
        checklist.add(new ActivationDtos.ActivationStep(
                "CREATE_TASK",
                "Create your first task",
                "Start with title only. Add details later.",
                createdTask ? "DONE" : "AVAILABLE",
                new ActivationDtos.ActionLink("Create first task", "/app/projects/board?create=1"),
                List.of(new ActivationDtos.ActionLink("Import tasks", "/app/integrations/import"))
        ));
        checklist.add(new ActivationDtos.ActivationStep(
                "OPEN_BOARD",
                "Move one task on board",
                "Confirm execution flow in board view.",
                !createdTask ? "LOCKED" : boardOpened ? "DONE" : "AVAILABLE",
                new ActivationDtos.ActionLink("Open board", "/app/projects/board"),
                List.of()
        ));
        checklist.add(new ActivationDtos.ActivationStep(
                "START_SPRINT",
                "Start sprint",
                "Generate day plan and freeze your plan.",
                !createdTask ? "LOCKED" : sprintEntered ? "DONE" : "AVAILABLE",
                new ActivationDtos.ActionLink("Open sprint", "/app/sprint"),
                List.of()
        ));
        checklist.add(new ActivationDtos.ActivationStep(
                "RUN_AI_INSIGHT",
                "Run AI insight",
                "Generate risk and mitigation draft.",
                !createdTask ? "LOCKED" : insightStarted ? "DONE" : "AVAILABLE",
                new ActivationDtos.ActionLink("Open insights", "/app/insights#run"),
                List.of()
        ));
        checklist.add(new ActivationDtos.ActivationStep(
                "TRIAGE_INBOX",
                "Triage inbox",
                "Resolve collaboration requests and mentions.",
                !createdTask ? "LOCKED" : inboxTriaged ? "DONE" : "AVAILABLE",
                new ActivationDtos.ActionLink("Open inbox", "/app/inbox"),
                List.of()
        ));
        return checklist;
    }

    private Instant now() {
        return Instant.now(clock);
    }

    private record ScopeKey(String workspaceId, String projectId, String userId) {
    }

    private record ActivationStateModel(
            String workspaceId,
            String projectId,
            String userId,
            Instant firstSessionStartedAt,
            Instant firstTaskCreatedAt,
            Instant boardInteractedAt,
            Instant sprintEnteredAt,
            Instant insightEvaluationStartedAt,
            Instant insightEvaluationCompletedAt,
            Instant inboxTriagedAt,
            String activationStage,
            String navigationProfile,
            boolean completed,
            String completionReason,
            Instant updatedAt
    ) {
        private static ActivationStateModel create(String workspaceId, String projectId, String userId, Instant startedAt) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    startedAt,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "NOT_STARTED",
                    "NOVICE",
                    false,
                    null,
                    startedAt
            );
        }

        private ActivationStateModel withUpdatedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    timestamp
            );
        }

        private ActivationStateModel withFirstTaskCreatedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt == null ? timestamp : firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel withBoardInteractedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt == null ? timestamp : boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel withSprintEnteredAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt == null ? timestamp : sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel withInsightEvaluationStartedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt == null ? timestamp : insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel withInsightEvaluationCompletedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt == null ? timestamp : insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel withInboxTriagedAt(Instant timestamp) {
            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt == null ? timestamp : inboxTriagedAt,
                    activationStage,
                    navigationProfile,
                    completed,
                    completionReason,
                    updatedAt
            );
        }

        private ActivationStateModel recomputeStage() {
            boolean hasFirstTask = firstTaskCreatedAt != null;
            int coreSteps = 0;
            if (boardInteractedAt != null) {
                coreSteps += 1;
            }
            if (sprintEnteredAt != null) {
                coreSteps += 1;
            }
            if (insightEvaluationStartedAt != null || insightEvaluationCompletedAt != null) {
                coreSteps += 1;
            }
            if (inboxTriagedAt != null) {
                coreSteps += 1;
            }
            String stage = activationStage;
            boolean isCompleted = completed;
            String reason = completionReason;
            String profile = navigationProfile;

            if (!hasFirstTask) {
                stage = "NOT_STARTED";
                isCompleted = false;
                reason = null;
                profile = "NOVICE";
            } else if (coreSteps >= 2) {
                stage = "COMPLETED";
                isCompleted = true;
                reason = "TASK_PLUS_TWO_CORE_STEPS";
                profile = "ADVANCED";
            } else if (coreSteps == 1) {
                stage = "CORE_FLOW_CONTINUED";
                isCompleted = false;
                reason = "TASK_PLUS_ONE_CORE_STEP";
                profile = "NOVICE";
            } else {
                stage = "FIRST_ACTION_DONE";
                isCompleted = false;
                reason = "FIRST_TASK_ONLY";
                profile = "NOVICE";
            }

            return new ActivationStateModel(
                    workspaceId,
                    projectId,
                    userId,
                    firstSessionStartedAt,
                    firstTaskCreatedAt,
                    boardInteractedAt,
                    sprintEnteredAt,
                    insightEvaluationStartedAt,
                    insightEvaluationCompletedAt,
                    inboxTriagedAt,
                    stage,
                    profile,
                    isCompleted,
                    reason,
                    updatedAt
            );
        }
    }
}
