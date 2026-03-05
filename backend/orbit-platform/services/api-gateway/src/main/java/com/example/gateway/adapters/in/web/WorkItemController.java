package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.InMemoryWorkItemStore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final InMemoryWorkItemStore store;

    public WorkItemController(InMemoryWorkItemStore store) {
        this.store = store;
    }

    @PostMapping("/api/work-items")
    public WorkItemView create(@Valid @RequestBody CreateWorkItemRequest request) {
        return createV2(new CreateWorkItemV2Request(
                request.projectId(),
                request.type(),
                request.title(),
                request.assignee(),
                request.startAt(),
                request.dueAt(),
                request.priority(),
                null,
                null,
                null,
                null
        ));
    }

    @PostMapping("/api/v2/work-items")
    public WorkItemView createV2(@Valid @RequestBody CreateWorkItemV2Request request) {
        InMemoryWorkItemStore.WorkItemState created = store.create(new InMemoryWorkItemStore.CreateInput(
                UUID.fromString(request.projectId()),
                request.type(),
                request.title(),
                request.assignee(),
                request.startAt(),
                request.dueAt(),
                request.priority(),
                request.estimateMinutes(),
                request.actualMinutes(),
                request.blockedReason(),
                request.markdownBody()
        ));
        return toView(created);
    }

    @PatchMapping("/api/work-items/{workItemId}")
    public WorkItemView updateStatus(@PathVariable UUID workItemId, @Valid @RequestBody UpdateWorkItemStatusRequest request) {
        return toView(store.updateStatus(workItemId, request.status()));
    }

    @PatchMapping("/api/v2/work-items/{workItemId}")
    public WorkItemView patchWorkItem(@PathVariable UUID workItemId, @Valid @RequestBody PatchWorkItemV2Request request) {
        InMemoryWorkItemStore.WorkItemState updated = store.patch(workItemId, new InMemoryWorkItemStore.PatchInput(
                request.type(),
                request.title(),
                request.status(),
                request.assignee(),
                request.startAt(),
                request.dueAt(),
                request.priority(),
                request.estimateMinutes(),
                request.actualMinutes(),
                request.blockedReason(),
                request.markdownBody()
        ));
        return toView(updated);
    }

    @PatchMapping("/api/v2/work-items/{workItemId}/status")
    public WorkItemView patchWorkItemStatus(@PathVariable UUID workItemId, @Valid @RequestBody UpdateWorkItemStatusRequest request) {
        return toView(store.updateStatus(workItemId, request.status()));
    }

    @PostMapping("/api/work-items/{workItemId}/dependencies")
    public DependencyView addDependency(@PathVariable UUID workItemId, @Valid @RequestBody AddDependencyRequest request) {
        return addDependencyV2(workItemId, request);
    }

    @PostMapping("/api/v2/work-items/{workItemId}/dependencies")
    public DependencyView addDependencyV2(@PathVariable UUID workItemId, @Valid @RequestBody AddDependencyRequest request) {
        UUID toWorkItemId = UUID.fromString(request.toWorkItemId());
        InMemoryWorkItemStore.DependencyState edge = store.addDependency(workItemId, toWorkItemId, request.type());
        return new DependencyView(edge.dependencyId(), edge.fromWorkItemId(), edge.toWorkItemId(), edge.type(), edge.createdAt());
    }

    @DeleteMapping("/api/v2/dependencies/{dependencyId}")
    public void deleteDependencyV2(@PathVariable UUID dependencyId) {
        store.deleteDependency(dependencyId);
    }

    @GetMapping("/api/work-items")
    public List<WorkItemView> list(@RequestParam(required = false) String projectId,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(required = false) String assignee,
                                   @RequestParam(required = false) String query,
                                   @RequestParam(required = false) String groupBy) {
        return listV2(projectId, status, assignee, query, groupBy);
    }

    @GetMapping("/api/v2/work-items")
    public List<WorkItemView> listV2(@RequestParam(required = false) String projectId,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false) String assignee,
                                     @RequestParam(required = false) String query,
                                     @RequestParam(required = false) String groupBy) {
        return store.list(projectId, status, assignee, query, groupBy).stream().map(this::toView).toList();
    }

    @GetMapping("/api/work-items/dependency-graph")
    public DependencyGraphView dependencyGraph(@RequestParam(required = false) String projectId) {
        return dependencyGraphV2(projectId);
    }

    @GetMapping("/api/v2/work-items/dependency-graph")
    public DependencyGraphView dependencyGraphV2(@RequestParam(required = false) String projectId) {
        InMemoryWorkItemStore.DependencyGraph graph = store.dependencyGraph(projectId);
        List<DependencyNodeView> nodes = graph.nodes().stream()
                .map(node -> new DependencyNodeView(node.workItemId(), node.title(), node.status(), node.upstreamCount(), node.downstreamCount()))
                .toList();
        List<DependencyView> edges = graph.edges().stream()
                .map(edge -> new DependencyView(edge.dependencyId(), edge.fromWorkItemId(), edge.toWorkItemId(), edge.type(), edge.createdAt()))
                .toList();
        return new DependencyGraphView(nodes, edges);
    }

    @GetMapping("/api/v2/work-items/{workItemId}/activity")
    public List<ActivityView> listActivity(@PathVariable UUID workItemId) {
        return store.listActivity(workItemId).stream()
                .map(activity -> new ActivityView(
                        activity.activityId(),
                        activity.workItemId(),
                        activity.action(),
                        activity.actorId(),
                        activity.payload(),
                        activity.createdAt()))
                .toList();
    }

    private WorkItemView toView(InMemoryWorkItemStore.WorkItemState state) {
        int activityCount = store.listActivity(state.workItemId()).size();
        return new WorkItemView(
                state.workItemId(),
                state.projectId(),
                state.type(),
                state.title(),
                state.status(),
                state.assignee(),
                state.startAt(),
                state.dueAt(),
                state.priority(),
                state.estimateMinutes(),
                state.actualMinutes(),
                state.blockedReason(),
                state.markdownBody(),
                activityCount,
                state.createdAt(),
                state.updatedAt());
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

    public record CreateWorkItemV2Request(
            @NotBlank String projectId,
            @NotBlank String type,
            @NotBlank String title,
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

    public record PatchWorkItemV2Request(
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
            Integer estimateMinutes,
            Integer actualMinutes,
            String blockedReason,
            String markdownBody,
            int activityCount,
            String createdAt,
            String updatedAt
    ) {
    }

    public record DependencyView(UUID dependencyId, UUID fromWorkItemId, UUID toWorkItemId, String type, String createdAt) {
    }

    public record DependencyNodeView(UUID workItemId, String title, String status, int upstreamCount, int downstreamCount) {
    }

    public record DependencyGraphView(List<DependencyNodeView> nodes, List<DependencyView> edges) {
    }

    public record ActivityView(
            UUID activityId,
            UUID workItemId,
            String action,
            String actorId,
            Object payload,
            String createdAt
    ) {
    }
}
