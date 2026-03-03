package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agile")
public class SprintController {
    private final Map<UUID, SprintView> sprints = new ConcurrentHashMap<>();
    private final Map<UUID, List<BacklogItemView>> backlogBySprint = new ConcurrentHashMap<>();
    private final Map<UUID, List<DSUView>> dsuBySprint = new ConcurrentHashMap<>();

    @PostMapping("/sprints")
    public SprintView createSprint(@Valid @RequestBody CreateSprintRequest request) {
        SprintView sprint = new SprintView(
                UUID.randomUUID(),
                UUID.fromString(request.workspaceId()),
                UUID.fromString(request.projectId()),
                request.name(),
                request.goal(),
                request.startDate(),
                request.endDate(),
                request.capacitySp(),
                "PLANNED",
                Instant.now().toString());
        sprints.put(sprint.sprintId(), sprint);
        backlogBySprint.putIfAbsent(sprint.sprintId(), new ArrayList<>());
        dsuBySprint.putIfAbsent(sprint.sprintId(), new ArrayList<>());
        return sprint;
    }

    @PostMapping("/sprints/{sprintId}/backlog")
    public BacklogItemView addBacklog(@PathVariable UUID sprintId,
                                      @Valid @RequestBody AddBacklogItemRequest request) {
        requireSprint(sprintId);
        BacklogItemView item = new BacklogItemView(
                UUID.randomUUID(),
                sprintId,
                request.workItemId(),
                request.rank(),
                request.status() == null || request.status().isBlank() ? "READY" : request.status());
        backlogBySprint.computeIfAbsent(sprintId, ignored -> new ArrayList<>()).add(item);
        return item;
    }

    @PostMapping("/sprints/{sprintId}/dsu")
    public DSUView submitDsu(@PathVariable UUID sprintId, @Valid @RequestBody SubmitDsuRequest request) {
        requireSprint(sprintId);
        int blockerCount = estimateBlockerCount(request.rawText());
        DSUView dsu = new DSUView(
                UUID.randomUUID(),
                sprintId,
                request.authorId(),
                request.rawText(),
                blockerCount,
                blockerCount > 0 ? "at_risk" : "on_track",
                Instant.now().toString());
        dsuBySprint.computeIfAbsent(sprintId, ignored -> new ArrayList<>()).add(dsu);
        return dsu;
    }

    @GetMapping("/sprints/{sprintId}/backlog")
    public List<BacklogItemView> listBacklog(@PathVariable UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(backlogBySprint.getOrDefault(sprintId, List.of()));
    }

    @GetMapping("/sprints/{sprintId}/dsu")
    public List<DSUView> listDsu(@PathVariable UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(dsuBySprint.getOrDefault(sprintId, List.of()));
    }

    private SprintView requireSprint(UUID sprintId) {
        SprintView sprint = sprints.get(sprintId);
        if (sprint == null) {
            throw new IllegalArgumentException("Sprint not found");
        }
        return sprint;
    }

    private int estimateBlockerCount(String text) {
        String raw = text == null ? "" : text.toLowerCase();
        if (raw.contains("blocked") || raw.contains("blocker") || raw.contains("대기") || raw.contains("승인")) {
            return 1;
        }
        return 0;
    }

    public record CreateSprintRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            @NotBlank String name,
            @NotBlank String goal,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            int capacitySp
    ) {
    }

    public record AddBacklogItemRequest(@NotNull UUID workItemId, int rank, String status) {
    }

    public record SubmitDsuRequest(@NotBlank String authorId, @NotBlank String rawText) {
    }

    public record SprintView(
            UUID sprintId,
            UUID workspaceId,
            UUID projectId,
            String name,
            String goal,
            LocalDate startDate,
            LocalDate endDate,
            int capacitySp,
            String status,
            String createdAt
    ) {
    }

    public record BacklogItemView(UUID backlogItemId, UUID sprintId, UUID workItemId, int rank, String status) {
    }

    public record DSUView(UUID dsuId, UUID sprintId, String authorId, String rawText, int blockerCount, String statusSignal, String createdAt) {
    }
}
