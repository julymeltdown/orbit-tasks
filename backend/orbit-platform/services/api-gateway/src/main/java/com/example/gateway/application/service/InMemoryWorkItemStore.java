package com.example.gateway.application.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class InMemoryWorkItemStore {
    private final Map<UUID, WorkItemState> items = new ConcurrentHashMap<>();
    private final List<DependencyState> dependencies = new CopyOnWriteArrayList<>();
    private final Map<UUID, List<ActivityState>> activityByWorkItem = new ConcurrentHashMap<>();

    public WorkItemState create(CreateInput input) {
        WorkItemState state = new WorkItemState(
                UUID.randomUUID(),
                input.projectId(),
                input.type(),
                input.title(),
                "TODO",
                normalize(input.assignee()),
                normalize(input.startAt()),
                normalize(input.dueAt()),
                normalize(input.priority()),
                input.estimateMinutes(),
                input.actualMinutes(),
                normalize(input.blockedReason()),
                normalize(input.markdownBody()),
                Instant.now().toString(),
                Instant.now().toString());
        items.put(state.workItemId(), state);
        recordActivity(state.workItemId(), "WORK_ITEM_CREATED", "gateway", Map.of("title", state.title()));
        return state;
    }

    public WorkItemState patch(UUID workItemId, PatchInput input) {
        WorkItemState current = require(workItemId);
        WorkItemState next = new WorkItemState(
                current.workItemId(),
                current.projectId(),
                normalizeOrDefault(input.type(), current.type()),
                normalizeOrDefault(input.title(), current.title()),
                normalizeOrDefault(input.status(), current.status()),
                normalizeOrDefault(input.assignee(), current.assignee()),
                normalizeOrDefault(input.startAt(), current.startAt()),
                normalizeOrDefault(input.dueAt(), current.dueAt()),
                normalizeOrDefault(input.priority(), current.priority()),
                input.estimateMinutes() == null ? current.estimateMinutes() : input.estimateMinutes(),
                input.actualMinutes() == null ? current.actualMinutes() : input.actualMinutes(),
                normalizeOrDefault(input.blockedReason(), current.blockedReason()),
                normalizeOrDefault(input.markdownBody(), current.markdownBody()),
                current.createdAt(),
                Instant.now().toString());
        items.put(workItemId, next);
        recordActivity(workItemId, "WORK_ITEM_PATCHED", "gateway", Map.of("status", next.status()));
        return next;
    }

    public WorkItemState updateStatus(UUID workItemId, String status) {
        return patch(workItemId, new PatchInput(null, null, status, null, null, null, null, null, null, null, null));
    }

    public DependencyState addDependency(UUID fromWorkItemId, UUID toWorkItemId, String type) {
        require(fromWorkItemId);
        require(toWorkItemId);
        if (fromWorkItemId.equals(toWorkItemId)) {
            throw new IllegalArgumentException("DEPENDENCY_CYCLE");
        }
        if (wouldCreateCycle(fromWorkItemId, toWorkItemId)) {
            throw new IllegalArgumentException("DEPENDENCY_CYCLE");
        }

        DependencyState edge = new DependencyState(
                UUID.randomUUID(),
                fromWorkItemId,
                toWorkItemId,
                normalizeOrDefault(type, "FS"),
                Instant.now().toString());
        dependencies.add(edge);
        recordActivity(fromWorkItemId, "DEPENDENCY_ADDED", "gateway", Map.of("dependencyId", edge.dependencyId().toString()));
        return edge;
    }

    public void deleteDependency(UUID dependencyId) {
        DependencyState match = dependencies.stream()
                .filter(dep -> dep.dependencyId().equals(dependencyId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("DEPENDENCY_NOT_FOUND"));
        dependencies.remove(match);
        recordActivity(match.fromWorkItemId(), "DEPENDENCY_DELETED", "gateway", Map.of("dependencyId", dependencyId.toString()));
    }

    public List<WorkItemState> list(String projectId, String status, String assignee, String query, String groupBy) {
        return items.values().stream()
                .filter(item -> projectId == null || projectId.isBlank() || item.projectId().toString().equals(projectId))
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> assignee == null || assignee.isBlank() || Objects.equals(item.assignee(), assignee))
                .filter(item -> query == null || query.isBlank() || item.title().toLowerCase().contains(query.toLowerCase()))
                .sorted(resolveComparator(groupBy))
                .toList();
    }

    public DependencyGraph dependencyGraph(String projectId) {
        List<WorkItemState> filteredItems = list(projectId, null, null, null, null);
        Map<UUID, WorkItemState> allowed = filteredItems.stream()
                .collect(Collectors.toMap(WorkItemState::workItemId, item -> item));

        List<DependencyState> edges = dependencies.stream()
                .filter(edge -> allowed.containsKey(edge.fromWorkItemId()) && allowed.containsKey(edge.toWorkItemId()))
                .toList();

        Map<UUID, Long> upstreamCount = edges.stream()
                .collect(Collectors.groupingBy(DependencyState::toWorkItemId, Collectors.counting()));
        Map<UUID, Long> downstreamCount = edges.stream()
                .collect(Collectors.groupingBy(DependencyState::fromWorkItemId, Collectors.counting()));

        List<DependencyNode> nodes = filteredItems.stream()
                .map(item -> new DependencyNode(
                        item.workItemId(),
                        item.title(),
                        item.status(),
                        upstreamCount.getOrDefault(item.workItemId(), 0L).intValue(),
                        downstreamCount.getOrDefault(item.workItemId(), 0L).intValue()))
                .toList();

        return new DependencyGraph(nodes, edges);
    }

    public List<ActivityState> listActivity(UUID workItemId) {
        require(workItemId);
        return List.copyOf(activityByWorkItem.getOrDefault(workItemId, List.of()));
    }

    public void recordActivity(UUID workItemId, String action, String actorId, Map<String, Object> payload) {
        ActivityState state = new ActivityState(
                UUID.randomUUID(),
                workItemId,
                normalizeOrDefault(action, "UNKNOWN"),
                normalizeOrDefault(actorId, "system"),
                payload == null ? Map.of() : payload,
                Instant.now().toString());
        activityByWorkItem.computeIfAbsent(workItemId, ignored -> new CopyOnWriteArrayList<>()).add(0, state);
    }

    private WorkItemState require(UUID workItemId) {
        WorkItemState state = items.get(workItemId);
        if (state == null) {
            throw new IllegalArgumentException("WORK_ITEM_NOT_FOUND");
        }
        return state;
    }

    private boolean wouldCreateCycle(UUID from, UUID to) {
        if (from.equals(to)) {
            return true;
        }
        Map<UUID, List<UUID>> graph = new ConcurrentHashMap<>();
        for (DependencyState edge : dependencies) {
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

    private Comparator<WorkItemState> resolveComparator(String groupBy) {
        if (groupBy == null || groupBy.isBlank()) {
            return Comparator.comparing(WorkItemState::createdAt).reversed();
        }
        if ("priority".equalsIgnoreCase(groupBy)) {
            return Comparator.comparing(WorkItemState::priority, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        if ("status".equalsIgnoreCase(groupBy)) {
            return Comparator.comparing(WorkItemState::status, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        if ("dueAt".equalsIgnoreCase(groupBy)) {
            return Comparator.comparing(WorkItemState::dueAt, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        return Comparator.comparing(WorkItemState::createdAt).reversed();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeOrDefault(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? fallback : normalized;
    }

    public record CreateInput(
            UUID projectId,
            String type,
            String title,
            String assignee,
            String startAt,
            String dueAt,
            String priority,
            Integer estimateMinutes,
            Integer actualMinutes,
            String blockedReason,
            String markdownBody
    ) {
    }

    public record PatchInput(
            String type,
            String title,
            String status,
            String assignee,
            String startAt,
            String dueAt,
            String priority,
            Integer estimateMinutes,
            Integer actualMinutes,
            String blockedReason,
            String markdownBody
    ) {
    }

    public record WorkItemState(
            UUID workItemId,
            UUID projectId,
            String type,
            String title,
            String status,
            String assignee,
            String startAt,
            String dueAt,
            String priority,
            Integer estimateMinutes,
            Integer actualMinutes,
            String blockedReason,
            String markdownBody,
            String createdAt,
            String updatedAt
    ) {
    }

    public record DependencyState(
            UUID dependencyId,
            UUID fromWorkItemId,
            UUID toWorkItemId,
            String type,
            String createdAt
    ) {
    }

    public record DependencyNode(
            UUID workItemId,
            String title,
            String status,
            int upstreamCount,
            int downstreamCount
    ) {
    }

    public record DependencyGraph(
            List<DependencyNode> nodes,
            List<DependencyState> edges
    ) {
    }

    public record ActivityState(
            UUID activityId,
            UUID workItemId,
            String action,
            String actorId,
            Map<String, Object> payload,
            String createdAt
    ) {
    }
}
