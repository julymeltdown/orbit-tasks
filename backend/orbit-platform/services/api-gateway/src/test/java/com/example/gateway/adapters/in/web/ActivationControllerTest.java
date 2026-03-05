package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.ActivationDtos;
import com.example.gateway.application.service.ActivationService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActivationControllerTest {
    @Test
    void returnsActivationState() {
        ActivationService activationService = mock(ActivationService.class);
        ActivationController controller = new ActivationController(activationService);
        ActivationDtos.ActivationStateResponse expected = new ActivationDtos.ActivationStateResponse(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                "member@test.local",
                "NOT_STARTED",
                "NOVICE",
                false,
                null,
                List.of(),
                "2026-03-05T00:00:00Z"
        );
        when(activationService.getState(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                "member@test.local"
        )).thenReturn(expected);

        ActivationDtos.ActivationStateResponse response = controller.state(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                "member@test.local"
        );

        assertEquals("NOT_STARTED", response.activationStage());
        assertEquals("NOVICE", response.navigationProfile());
    }

    @Test
    void acceptsEventPayload() {
        ActivationService activationService = mock(ActivationService.class);
        ActivationController controller = new ActivationController(activationService);
        ActivationDtos.ActivationEventRequest request = new ActivationDtos.ActivationEventRequest(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                "member@test.local",
                "session-1",
                "ACTIVATION_PRIMARY_CTA_CLICKED",
                "/app",
                1200,
                Map.of("cta", "create_first_task")
        );
        when(activationService.recordEvent(
                eq("00000000-0000-0000-0000-000000000001"),
                eq("00000000-0000-0000-0000-000000000002"),
                any(ActivationDtos.ActivationEventRequest.class)
        )).thenReturn(new ActivationDtos.ActivationStateResponse(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                "member@test.local",
                "FIRST_ACTION_DONE",
                "NOVICE",
                false,
                "FIRST_TASK_ONLY",
                List.of(),
                "2026-03-05T00:00:00Z"
        ));

        ActivationDtos.AcceptedResponse response = controller.event(request);

        verify(activationService).recordEvent(
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
                request
        );
        assertEquals("accepted", response.status());
    }
}
