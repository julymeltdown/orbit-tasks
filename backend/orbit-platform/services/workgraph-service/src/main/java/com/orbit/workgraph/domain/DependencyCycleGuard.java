package com.orbit.workgraph.domain;

import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class DependencyCycleGuard {
    public boolean wouldCreateCycle(List<DependencyEdge> existingEdges, DependencyEdge nextEdge) {
        Map<UUID, Set<UUID>> adjacency = new HashMap<>();

        for (DependencyEdge edge : existingEdges) {
            adjacency.computeIfAbsent(edge.from(), ignored -> new HashSet<>()).add(edge.to());
        }
        adjacency.computeIfAbsent(nextEdge.from(), ignored -> new HashSet<>()).add(nextEdge.to());

        ArrayDeque<UUID> stack = new ArrayDeque<>();
        Set<UUID> visited = new HashSet<>();
        stack.push(nextEdge.from());

        while (!stack.isEmpty()) {
            UUID current = stack.pop();
            if (!visited.add(current)) {
                continue;
            }
            for (UUID target : adjacency.getOrDefault(current, Set.of())) {
                if (target.equals(nextEdge.from())) {
                    return true;
                }
                stack.push(target);
            }
        }
        return false;
    }

    public record DependencyEdge(UUID from, UUID to) {
    }
}
