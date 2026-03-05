package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.ActivationDtos;
import com.example.gateway.application.service.ActivationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/activation")
public class ActivationController {
    private final ActivationService activationService;

    public ActivationController(ActivationService activationService) {
        this.activationService = activationService;
    }

    @GetMapping("/state")
    public ActivationDtos.ActivationStateResponse state(
            @RequestParam @NotBlank String workspaceId,
            @RequestParam @NotBlank String projectId,
            @RequestParam @NotBlank String userId) {
        return activationService.getState(workspaceId, projectId, userId);
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ActivationDtos.AcceptedResponse event(@Valid @RequestBody ActivationDtos.ActivationEventRequest request) {
        activationService.recordEvent(request.workspaceId(), request.projectId(), request);
        return new ActivationDtos.AcceptedResponse("accepted", null);
    }
}
