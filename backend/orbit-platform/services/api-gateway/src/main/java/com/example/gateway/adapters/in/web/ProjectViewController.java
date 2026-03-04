package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectViewController {
    private final Map<UUID, List<ViewConfigurationView>> byProject = new ConcurrentHashMap<>();

    @GetMapping("/{projectId}/view-configurations")
    public List<ViewConfigurationView> list(@PathVariable UUID projectId) {
        return List.copyOf(byProject.getOrDefault(projectId, List.of()));
    }

    @PostMapping("/{projectId}/view-configurations")
    public ViewConfigurationView save(@PathVariable UUID projectId,
                                      @Valid @RequestBody SaveViewConfigurationRequest request) {
        ViewConfigurationView config = new ViewConfigurationView(
                UUID.randomUUID(),
                projectId,
                request.ownerScope() == null || request.ownerScope().isBlank() ? "USER" : request.ownerScope(),
                request.viewType(),
                request.filters() == null ? Map.of() : request.filters(),
                request.sort() == null ? Map.of() : request.sort(),
                request.groupBy(),
                request.isDefault(),
                request.createdBy() == null || request.createdBy().isBlank() ? "ui" : request.createdBy(),
                Instant.now().toString(),
                Instant.now().toString());

        List<ViewConfigurationView> existing = new ArrayList<>(byProject.getOrDefault(projectId, List.of()));
        if (config.isDefault()) {
            existing.removeIf(item -> item.viewType().equals(config.viewType()) && item.ownerScope().equals(config.ownerScope()));
        }
        existing.add(0, config);
        byProject.put(projectId, existing);
        return config;
    }

    public record SaveViewConfigurationRequest(
            @NotBlank String viewType,
            String ownerScope,
            Map<String, Object> filters,
            Map<String, Object> sort,
            String groupBy,
            boolean isDefault,
            String createdBy
    ) {
    }

    public record ViewConfigurationView(
            UUID viewConfigId,
            UUID projectId,
            String ownerScope,
            String viewType,
            Map<String, Object> filters,
            Map<String, Object> sort,
            String groupBy,
            boolean isDefault,
            String createdBy,
            String createdAt,
            String updatedAt
    ) {
    }
}

