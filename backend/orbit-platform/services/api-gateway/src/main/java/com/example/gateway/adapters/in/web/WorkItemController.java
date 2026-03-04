package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

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
        UUID toWorkItemId = UUID.fromString(request.toWorkItemId());
        DependencyView edge = new DependencyView(UUID.randomUUID(), workItemId, toWorkItemId, request.type() == null || request.type().isBlank() ? "FS" : request.type());
        if (wouldCreateCycle(workItemId, toWorkItemId)) {
            throw new IllegalArgumentException("dependency_cycle_detected");
        }
        dependencies.add(edge);
        return edge;
    }

    @GetMapping("/api/work-items")
    public List<WorkItemView> list(@RequestParam(required = false) String projectId,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(required = false) String assignee,
                                   @RequestParam(required = false) String query,
                                   @RequestParam(required = false) String groupBy) {
        return items.values().stream()
                .filter(item -> projectId == null || projectId.isBlank() || item.projectId().toString().equals(projectId))
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> assignee == null || assignee.isBlank() || Objects.equals(item.assignee(), assignee))
                .filter(item -> query == null || query.isBlank() || item.title().toLowerCase().contains(query.toLowerCase()))
                .sorted(resolveComparator(groupBy))
                .toList();
    }

    @GetMapping("/api/work-items/dependency-graph")
    public DependencyGraphView dependencyGraph(@RequestParam(required = false) String projectId) {
        List<WorkItemView> filteredItems = list(projectId, null, null, null, null);
        Map<UUID, WorkItemView> allowed = filteredItems.stream().collect(Collectors.toMap(WorkItemView::workItemId, item -> item));
        List<DependencyView> edges = dependencies.stream()
                .filter(edge -> allowed.containsKey(edge.fromWorkItemId()) && allowed.containsKey(edge.toWorkItemId()))
                .toList();

        Map<UUID, Long> upstreamCount = edges.stream()
                .collect(Collectors.groupingBy(DependencyView::toWorkItemId, Collectors.counting()));
        Map<UUID, Long> downstreamCount = edges.stream()
                .collect(Collectors.groupingBy(DependencyView::fromWorkItemId, Collectors.counting()));

        List<DependencyNodeView> nodes = filteredItems.stream()
                .map(item -> new DependencyNodeView(
                        item.workItemId(),
                        item.title(),
                        item.status(),
                        upstreamCount.getOrDefault(item.workItemId(), 0L).intValue(),
                        downstreamCount.getOrDefault(item.workItemId(), 0L).intValue()))
                .toList();

        return new DependencyGraphView(nodes, edges);
    }

    private boolean wouldCreateCycle(UUID from, UUID to) {
        if (from.equals(to)) {
            return true;
        }
        Map<UUID, List<UUID>> graph = new ConcurrentHashMap<>();
        for (DependencyView edge : dependencies) {
            graph.computeIfAbsent(edge.fromWorkItemId(), ignored -> new ArrayList<>()).add(edge.toWorkItemId());
        }
        graph.computeIfAbsent(from, ignored -> new ArrayList<>()).add(to);
        return isReachable(graph, to, from, List.of());
    }

    private boolean isReachable(Map<UUID, List<UUID>> graph, UUID current, UUID target, List<UUID> trail) {
        if (current.equals(target)) {
            return true;
        }
        if (trail.contains(current)) {
            return false;
        }
        List<UUID> nextTrail = new ArrayList<>(trail);
        nextTrail.add(current);
        for (UUID next : graph.getOrDefault(current, List.of())) {
            if (isReachable(graph, next, target, nextTrail)) {
                return true;
            }
        }
        return false;
    }

    private Comparator<WorkItemView> resolveComparator(String groupBy) {
        if (groupBy == null || groupBy.isBlank()) {
            return Comparator.comparing(WorkItemView::createdAt).reversed();
        }
        if ("priority".equalsIgnoreCase(groupBy)) {
            return Comparator.comparing(WorkItemView::priority, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        if ("status".equalsIgnoreCase(groupBy)) {
            return Comparator.comparing(WorkItemView::status, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        return Comparator.comparing(WorkItemView::createdAt).reversed();
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

    public record DependencyNodeView(UUID workItemId, String title, String status, int upstreamCount, int downstreamCount) {
    }

    public record DependencyGraphView(List<DependencyNodeView> nodes, List<DependencyView> edges) {
    }
}
