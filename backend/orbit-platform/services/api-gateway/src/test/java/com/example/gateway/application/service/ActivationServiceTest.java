package com.example.gateway.application.service;

import com.example.gateway.application.dto.ActivationDtos;
import com.example.gateway.application.port.out.ActivationEventSink;
import com.example.gateway.domain.activation.ActivationEventRecord;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActivationServiceTest {
    @Test
    void marksFirstActionDoneWhenFirstTaskCreated() {
        MemorySink sink = new MemorySink();
        ActivationService service = new ActivationService(sink, Clock.fixed(Instant.parse("2026-03-05T00:00:00Z"), ZoneOffset.UTC));

        service.recordEvent(
                "00000000-0000-0000-0000-000000000111",
                "00000000-0000-0000-0000-000000000222",
                new ActivationDtos.ActivationEventRequest(
                        "00000000-0000-0000-0000-000000000111",
                        "00000000-0000-0000-0000-000000000222",
                        "u1999494568",
                        "session-1",
                        "FIRST_TASK_CREATED",
                        "/app",
                        3400,
                        Map.of("cta", "create_first_task")
                )
        );

        ActivationDtos.ActivationStateResponse state = service.getState(
                "00000000-0000-0000-0000-000000000111",
                "00000000-0000-0000-0000-000000000222",
                "u1999494568"
        );
        assertEquals("FIRST_ACTION_DONE", state.activationStage());
        assertFalse(state.completed());
        assertEquals("DONE", state.checklist().get(0).status());
        assertTrue(sink.events.size() >= 1);
    }

    @Test
    void marksCompletedWhenCoreStepRecordedAfterTaskCreation() {
        MemorySink sink = new MemorySink();
        ActivationService service = new ActivationService(sink, Clock.fixed(Instant.parse("2026-03-05T00:00:00Z"), ZoneOffset.UTC));

        ActivationDtos.ActivationEventRequest firstTask = new ActivationDtos.ActivationEventRequest(
                "00000000-0000-0000-0000-000000000333",
                "00000000-0000-0000-0000-000000000444",
                "u419988554",
                "session-2",
                "FIRST_TASK_CREATED",
                "/app",
                1100,
                Map.of()
        );
        ActivationDtos.ActivationEventRequest board = new ActivationDtos.ActivationEventRequest(
                "00000000-0000-0000-0000-000000000333",
                "00000000-0000-0000-0000-000000000444",
                "u419988554",
                "session-2",
                "BOARD_FIRST_INTERACTION",
                "/app/projects/board",
                2400,
                Map.of("workItemId", "wi-1")
        );

        service.recordEvent(firstTask.workspaceId(), firstTask.projectId(), firstTask);
        service.recordEvent(board.workspaceId(), board.projectId(), board);

        ActivationDtos.ActivationStateResponse state = service.getState(
                "00000000-0000-0000-0000-000000000333",
                "00000000-0000-0000-0000-000000000444",
                "u419988554"
        );
        assertEquals("CORE_FLOW_CONTINUED", state.activationStage());
        assertFalse(state.completed());

        ActivationDtos.ActivationEventRequest insight = new ActivationDtos.ActivationEventRequest(
                "00000000-0000-0000-0000-000000000333",
                "00000000-0000-0000-0000-000000000444",
                "u419988554",
                "session-2",
                "INSIGHT_EVALUATION_STARTED",
                "/app/insights",
                3100,
                Map.of()
        );
        service.recordEvent(insight.workspaceId(), insight.projectId(), insight);
        ActivationDtos.ActivationStateResponse completed = service.getState(
                "00000000-0000-0000-0000-000000000333",
                "00000000-0000-0000-0000-000000000444",
                "u419988554"
        );
        assertEquals("COMPLETED", completed.activationStage());
        assertTrue(completed.completed());
        assertEquals("ADVANCED", completed.navigationProfile());
    }

    private static final class MemorySink implements ActivationEventSink {
        private final List<ActivationEventRecord> events = new ArrayList<>();

        @Override
        public void record(ActivationEventRecord event) {
            events.add(event);
        }
    }
}
