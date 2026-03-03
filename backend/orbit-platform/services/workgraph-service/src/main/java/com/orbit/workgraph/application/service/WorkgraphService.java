package com.orbit.workgraph.application.service;

import com.orbit.workgraph.domain.DependencyCycleGuard;
import com.orbit.workgraph.domain.WorkItem;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class WorkgraphService {
    private final Clock clock;
    private final DependencyCycleGuard cycleGuard = new DependencyCycleGuard();
    private final Map<UUID, WorkItem> workItems = new ConcurrentHashMap<>();
    private final List<DependencyCycleGuard.DependencyEdge> dependencies = new ArrayList<>();

    public WorkgraphService(Clock clock) {
        this.clock = clock;
    }

    public WorkItem create(UUID projectId, String type, String title, String assignee, Instant startAt, Instant dueAt, String priority) {
        WorkItem workItem = new WorkItem(
                UUID.randomUUID(),
                projectId,
                type,
                title,
                "TODO",
                assignee,
                startAt,
                dueAt,
                priority == null || priority.isBlank() ? "MEDIUM" : priority);
        workItems.put(workItem.id(), workItem);
        return workItem;
    }

    public WorkItem updateStatus(UUID workItemId, String status) {
        WorkItem current = require(workItemId);
        WorkItem updated = current.transitionTo(status);
        workItems.put(workItemId, updated);
        return updated;
    }

    public void addDependency(UUID from, UUID to) {
        DependencyCycleGuard.DependencyEdge edge = new DependencyCycleGuard.DependencyEdge(from, to);
        if (cycleGuard.wouldCreateCycle(dependencies, edge)) {
            throw new IllegalArgumentException("Dependency cycle detected");
        }
        dependencies.add(edge);
    }

    public List<WorkItem> list() {
        return workItems.values().stream().toList();
    }

    public List<DependencyCycleGuard.DependencyEdge> listDependencies() {
        return List.copyOf(dependencies);
    }

    private WorkItem require(UUID workItemId) {
        WorkItem value = workItems.get(workItemId);
        if (value == null) {
            throw new IllegalArgumentException("Work item not found");
        }
        return value;
    }

    public Instant now() {
        return Instant.now(clock);
    }
}
