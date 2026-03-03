package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class WorkItemController {
    private final Map<UUID, WorkItemView> items = new ConcurrentHashMap<>();
    private final List<DependencyView> dependencies = new ArrayList<>();

    @PostMapping("/api/work-items")
    public WorkItemView create(@Valid @RequestBody CreateWorkItemRequest request) {
        WorkItemView item = new WorkItemView(
                UUID.randomUUID(),
                UUID.fromString(request.projectId()),
                request.type(),
                request.title(),
                "TODO",
                request.assignee(),
                request.startAt(),
                request.dueAt(),
                request.priority(),
                Instant.now().toString());
        items.put(item.workItemId(), item);
        return item;
    }

    @PatchMapping("/api/work-items/{workItemId}")
    public WorkItemView updateStatus(@PathVariable UUID workItemId, @Valid @RequestBody UpdateWorkItemStatusRequest request) {
        WorkItemView current = items.get(workItemId);
        if (current == null) {
            throw new IllegalArgumentException("Work item not found");
        }
        WorkItemView updated = new WorkItemView(
                current.workItemId(),
                current.projectId(),
                current.type(),
                current.title(),
                request.status(),
                current.assignee(),
                current.startAt(),
                current.dueAt(),
                current.priority(),
                current.createdAt());
        items.put(workItemId, updated);
        return updated;
    }

    @PostMapping("/api/work-items/{workItemId}/dependencies")
    public DependencyView addDependency(@PathVariable UUID workItemId, @Valid @RequestBody AddDependencyRequest request) {
        DependencyView edge = new DependencyView(UUID.randomUUID(), workItemId, UUID.fromString(request.toWorkItemId()), request.type());
        dependencies.add(edge);
        return edge;
    }

    @GetMapping("/api/work-items")
    public List<WorkItemView> list() {
        return items.values().stream().toList();
    }

    public record CreateWorkItemRequest(
            @NotBlank String projectId,
            @NotBlank String type,
            @NotBlank String title,
            String assignee,
            String startAt,
            String dueAt,
            String priority
    ) {
    }

    public record UpdateWorkItemStatusRequest(@NotBlank String status) {
    }

    public record AddDependencyRequest(@NotBlank String toWorkItemId, String type) {
    }

    public record WorkItemView(
            UUID workItemId,
            UUID projectId,
            String type,
            String title,
            String status,
            String assignee,
            String startAt,
            String dueAt,
            String priority,
            String createdAt
    ) {
    }

    public record DependencyView(UUID dependencyId, UUID fromWorkItemId, UUID toWorkItemId, String type) {
    }
}
