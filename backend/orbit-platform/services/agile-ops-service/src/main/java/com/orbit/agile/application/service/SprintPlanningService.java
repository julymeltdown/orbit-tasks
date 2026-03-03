package com.orbit.agile.application.service;

import com.orbit.agile.domain.DSUEntry;
import com.orbit.agile.domain.Sprint;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;

@Service
public class SprintPlanningService {
    private final ConcurrentMap<UUID, Sprint> sprints = new ConcurrentHashMap<>();
    private final ConcurrentMap<UUID, List<BacklogItem>> backlogBySprint = new ConcurrentHashMap<>();
    private final ConcurrentMap<UUID, List<DSUEntry>> dsuBySprint = new ConcurrentHashMap<>();

    public Sprint createSprint(UUID workspaceId,
                               UUID projectId,
                               String name,
                               String goal,
                               LocalDate start,
                               LocalDate end,
                               int capacityStoryPoints) {
        Sprint sprint = new Sprint(
                UUID.randomUUID(),
                workspaceId,
                projectId,
                name,
                goal,
                start,
                end,
                capacityStoryPoints,
                Sprint.Status.PLANNED);
        sprints.put(sprint.id(), sprint);
        backlogBySprint.putIfAbsent(sprint.id(), new ArrayList<>());
        dsuBySprint.putIfAbsent(sprint.id(), new ArrayList<>());
        return sprint;
    }

    public BacklogItem addBacklog(UUID sprintId, UUID workItemId, int rank, String status) {
        requireSprint(sprintId);
        BacklogItem item = new BacklogItem(UUID.randomUUID(), sprintId, workItemId, rank, status == null ? "READY" : status);
        backlogBySprint.computeIfAbsent(sprintId, ignored -> new ArrayList<>()).add(item);
        backlogBySprint.get(sprintId).sort(Comparator.comparingInt(BacklogItem::rank));
        return item;
    }

    public DSUEntry appendDsu(DSUEntry entry) {
        UUID sprintId = entry.sprintId();
        if (sprintId == null) {
            throw new IllegalArgumentException("Sprint ID is required for DSU operating loop");
        }
        requireSprint(sprintId);
        dsuBySprint.computeIfAbsent(sprintId, ignored -> new ArrayList<>()).add(entry);
        return entry;
    }

    public List<BacklogItem> listBacklog(UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(backlogBySprint.getOrDefault(sprintId, List.of()));
    }

    public List<DSUEntry> listDsu(UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(dsuBySprint.getOrDefault(sprintId, List.of()));
    }

    public Sprint getSprint(UUID sprintId) {
        return requireSprint(sprintId);
    }

    private Sprint requireSprint(UUID sprintId) {
        Sprint sprint = sprints.get(sprintId);
        if (sprint == null) {
            throw new IllegalArgumentException("Sprint not found");
        }
        return sprint;
    }

    public record BacklogItem(UUID backlogItemId, UUID sprintId, UUID workItemId, int rank, String status) {
    }
}
