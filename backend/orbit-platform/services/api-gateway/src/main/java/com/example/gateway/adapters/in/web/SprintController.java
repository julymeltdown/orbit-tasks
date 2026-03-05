package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.InMemoryWorkItemStore;
import com.example.gateway.application.service.DsuSuggestionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class SprintController {
    private static final double LOW_CONFIDENCE_THRESHOLD = 0.6d;

    private final InMemoryWorkItemStore workItemStore;
    private final DsuSuggestionService dsuSuggestionService;
    private final Map<UUID, SprintView> sprints = new ConcurrentHashMap<>();
    private final Map<UUID, UUID> activeSprintByProject = new ConcurrentHashMap<>();
    private final Map<UUID, List<BacklogItemView>> backlogBySprint = new ConcurrentHashMap<>();
    private final Map<UUID, List<DayPlanView>> dayPlansBySprint = new ConcurrentHashMap<>();
    private final Map<UUID, DayPlanView> dayPlanIndex = new ConcurrentHashMap<>();
    private final Map<UUID, DsuEntryView> dsuEntries = new ConcurrentHashMap<>();
    private final Map<UUID, List<DsuSuggestionView>> suggestionsByDsu = new ConcurrentHashMap<>();
    private final Map<UUID, List<DsuApplyLogView>> applyLogsByDsu = new ConcurrentHashMap<>();

    public SprintController(InMemoryWorkItemStore workItemStore, DsuSuggestionService dsuSuggestionService) {
        this.workItemStore = workItemStore;
        this.dsuSuggestionService = dsuSuggestionService;
    }

    // Legacy compatibility endpoint
    @PostMapping("/api/agile/sprints")
    public SprintView createSprintLegacy(@Valid @RequestBody CreateSprintRequest request) {
        return createSprintV2(request);
    }

    @PostMapping("/api/v2/sprints")
    public SprintView createSprintV2(@Valid @RequestBody CreateSprintRequest request) {
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
                false,
                Math.max(60, request.dailyCapacityMinutes() == null ? request.capacitySp() * 60 : request.dailyCapacityMinutes()),
                Instant.now().toString(),
                Instant.now().toString());
        sprints.put(sprint.sprintId(), sprint);
        backlogBySprint.putIfAbsent(sprint.sprintId(), new ArrayList<>());
        dayPlansBySprint.putIfAbsent(sprint.sprintId(), new ArrayList<>());
        activeSprintByProject.put(sprint.projectId(), sprint.sprintId());
        return sprint;
    }

    // Legacy compatibility endpoint
    @PostMapping("/api/agile/sprints/{sprintId}/backlog")
    public BacklogItemView addBacklogLegacy(@PathVariable UUID sprintId, @Valid @RequestBody AddBacklogItemRequest request) {
        return addBacklogV2(sprintId, request);
    }

    @PostMapping("/api/v2/sprints/{sprintId}/backlog-items")
    public BacklogItemView addBacklogV2(@PathVariable UUID sprintId, @Valid @RequestBody AddBacklogItemRequest request) {
        SprintView sprint = requireSprint(sprintId);
        BacklogItemView item = new BacklogItemView(
                UUID.randomUUID(),
                sprintId,
                request.workItemId(),
                request.rank(),
                request.status() == null || request.status().isBlank() ? "READY" : request.status(),
                Instant.now().toString());
        backlogBySprint.computeIfAbsent(sprint.sprintId(), ignored -> new ArrayList<>()).add(item);
        return item;
    }

    @PostMapping("/api/v2/sprints/{sprintId}/day-plan:generate")
    public List<DayPlanView> generateDayPlan(@PathVariable UUID sprintId,
                                             @Valid @RequestBody GenerateDayPlanRequest request) {
        SprintView sprint = requireSprint(sprintId);
        ensureNotFrozen(sprint);

        List<BacklogItemView> backlog = backlogBySprint.getOrDefault(sprintId, List.of());
        long dayCount = Math.max(1, ChronoUnit.DAYS.between(sprint.startDate(), sprint.endDate()) + 1);
        int dailyCapacity = request.dailyCapacityMinutes() == null
                ? sprint.dailyCapacityMinutes()
                : Math.max(30, request.dailyCapacityMinutes());
        int bufferMinutes = request.bufferMinutes() == null ? Math.max(30, dailyCapacity / 5) : Math.max(0, request.bufferMinutes());

        List<DayPlanView> generated = new ArrayList<>();
        for (int i = 0; i < dayCount; i++) {
            LocalDate day = sprint.startDate().plusDays(i);
            UUID dayPlanId = UUID.randomUUID();

            List<DayPlanItemView> plannedItems = new ArrayList<>();
            int order = 1;
            for (int idx = i; idx < backlog.size(); idx += dayCount) {
                BacklogItemView backlogItem = backlog.get(idx);
                plannedItems.add(new DayPlanItemView(
                        UUID.randomUUID(),
                        dayPlanId,
                        backlogItem.workItemId(),
                        Math.max(15, (dailyCapacity - bufferMinutes) / Math.max(1, backlog.size())),
                        order++));
            }

            DayPlanView dayPlan = new DayPlanView(
                    dayPlanId,
                    sprintId,
                    day,
                    false,
                    dailyCapacity,
                    bufferMinutes,
                    plannedItems,
                    Instant.now().toString(),
                    Instant.now().toString());
            generated.add(dayPlan);
            dayPlanIndex.put(dayPlanId, dayPlan);
        }

        dayPlansBySprint.put(sprintId, generated);
        SprintView updatedSprint = sprint.withDailyCapacityMinutes(dailyCapacity);
        sprints.put(sprintId, updatedSprint);
        return List.copyOf(generated);
    }

    @PatchMapping("/api/v2/day-plans/{dayPlanId}")
    public DayPlanView patchDayPlan(@PathVariable UUID dayPlanId, @Valid @RequestBody PatchDayPlanRequest request) {
        DayPlanView current = requireDayPlan(dayPlanId);
        SprintView sprint = requireSprint(current.sprintId());
        ensureNotFrozen(sprint);

        List<DayPlanItemView> nextItems = request.items() == null ? current.items() : request.items().stream()
                .map(item -> new DayPlanItemView(
                        item.dayPlanItemId() == null ? UUID.randomUUID() : item.dayPlanItemId(),
                        dayPlanId,
                        item.workItemId(),
                        item.plannedMinutes(),
                        item.orderIndex()))
                .toList();
        DayPlanView updated = new DayPlanView(
                current.dayPlanId(),
                current.sprintId(),
                current.day(),
                request.locked() == null ? current.locked() : request.locked(),
                request.plannedMinutes() == null ? current.plannedMinutes() : request.plannedMinutes(),
                request.bufferMinutes() == null ? current.bufferMinutes() : request.bufferMinutes(),
                nextItems,
                current.createdAt(),
                Instant.now().toString());
        dayPlanIndex.put(dayPlanId, updated);
        replaceDayPlanInSprint(current.sprintId(), updated);
        return updated;
    }

    @PostMapping("/api/v2/sprints/{sprintId}:freeze")
    public SprintView freezeSprint(@PathVariable UUID sprintId, @Valid @RequestBody FreezeSprintRequest request) {
        SprintView current = requireSprint(sprintId);
        boolean freeze = request.freeze() == null || request.freeze();
        SprintView updated = new SprintView(
                current.sprintId(),
                current.workspaceId(),
                current.projectId(),
                current.name(),
                current.goal(),
                current.startDate(),
                current.endDate(),
                current.capacitySp(),
                freeze ? "ACTIVE" : current.status(),
                freeze,
                current.dailyCapacityMinutes(),
                current.createdAt(),
                Instant.now().toString());
        sprints.put(sprintId, updated);

        if (freeze) {
            List<DayPlanView> locked = dayPlansBySprint.getOrDefault(sprintId, List.of()).stream()
                    .map(plan -> new DayPlanView(
                            plan.dayPlanId(),
                            plan.sprintId(),
                            plan.day(),
                            true,
                            plan.plannedMinutes(),
                            plan.bufferMinutes(),
                            plan.items(),
                            plan.createdAt(),
                            Instant.now().toString()))
                    .toList();
            dayPlansBySprint.put(sprintId, locked);
            locked.forEach(plan -> dayPlanIndex.put(plan.dayPlanId(), plan));
        }
        return updated;
    }

    // Legacy compatibility endpoint
    @PostMapping("/api/agile/sprints/{sprintId}/dsu")
    public DSUView submitDsuLegacy(@PathVariable UUID sprintId, @Valid @RequestBody SubmitDsuRequest legacyRequest) {
        DsuEntryView entry = submitDsuV2(new DsuCreateRequest(
                requireSprint(sprintId).workspaceId().toString(),
                requireSprint(sprintId).projectId().toString(),
                sprintId.toString(),
                legacyRequest.authorId(),
                legacyRequest.rawText()
        ));
        int blockerCount = estimateBlockerCount(entry.rawText());
        return new DSUView(
                entry.dsuId(),
                sprintId,
                entry.authorId(),
                entry.rawText(),
                blockerCount,
                blockerCount > 0 ? "at_risk" : "on_track",
                entry.createdAt());
    }

    @PostMapping("/api/v2/dsu")
    public DsuEntryView submitDsuV2(@Valid @RequestBody DsuCreateRequest request) {
        UUID workspaceId = UUID.fromString(request.workspaceId());
        UUID projectId = UUID.fromString(request.projectId());
        UUID sprintId = resolveSprintId(projectId, request.sprintId());
        requireSprint(sprintId);

        DsuEntryView entry = new DsuEntryView(
                UUID.randomUUID(),
                workspaceId,
                projectId,
                sprintId,
                request.authorId(),
                request.rawText(),
                Instant.now().toString());
        dsuEntries.put(entry.dsuId(), entry);
        suggestionsByDsu.putIfAbsent(entry.dsuId(), new ArrayList<>());
        applyLogsByDsu.putIfAbsent(entry.dsuId(), new ArrayList<>());
        return entry;
    }

    @PostMapping("/api/v2/dsu/{dsuId}:suggest")
    public List<DsuSuggestionView> suggest(@PathVariable UUID dsuId, @Valid @RequestBody DsuSuggestRequest request) {
        DsuEntryView entry = requireDsu(dsuId);
        List<String> backlogWorkItemIds = backlogBySprint.getOrDefault(entry.sprintId(), List.of()).stream()
                .map(backlogItem -> backlogItem.workItemId().toString())
                .toList();
        List<DsuSuggestionView> suggestions = dsuSuggestionService.suggest(
                        new DsuSuggestionService.SuggestionContext(
                                entry.workspaceId().toString(),
                                entry.projectId().toString(),
                                entry.sprintId().toString(),
                                entry.authorId(),
                                entry.rawText()
                        ),
                        backlogWorkItemIds
                )
                .stream()
                .map(draft -> new DsuSuggestionView(
                        UUID.randomUUID(),
                        dsuId,
                        draft.targetType(),
                        draft.targetId(),
                        draft.proposedChange(),
                        draft.confidence(),
                        draft.reason(),
                        false
                ))
                .toList();

        suggestionsByDsu.put(dsuId, new ArrayList<>(suggestions));
        return suggestions;
    }

    @PostMapping("/api/v2/dsu/{dsuId}:apply")
    public DsuApplyResponse apply(@PathVariable UUID dsuId, @Valid @RequestBody DsuApplyRequest request) {
        DsuEntryView entry = requireDsu(dsuId);
        List<DsuSuggestionView> existing = new ArrayList<>(suggestionsByDsu.getOrDefault(dsuId, List.of()));
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("CONFIRMATION_REQUIRED");
        }

        List<DsuApplyItem> approvals = request.suggestions() == null ? List.of() : request.suggestions().stream()
                .filter(DsuApplyItem::approved)
                .toList();
        if (approvals.isEmpty()) {
            throw new IllegalArgumentException("CONFIRMATION_REQUIRED");
        }

        int applied = 0;
        int skipped = 0;
        List<DsuSuggestionView> updatedSuggestions = new ArrayList<>();
        for (DsuSuggestionView suggestion : existing) {
            DsuApplyItem approval = approvals.stream()
                    .filter(item -> item.suggestionId().equals(suggestion.suggestionId()))
                    .findFirst()
                    .orElse(null);

            if (approval == null) {
                updatedSuggestions.add(suggestion);
                continue;
            }
            if (suggestion.confidence() < LOW_CONFIDENCE_THRESHOLD) {
                throw new IllegalArgumentException("LOW_CONFIDENCE");
            }
            if (!"WORK_ITEM_PATCH".equals(suggestion.targetType()) || suggestion.targetId().isBlank()) {
                skipped++;
                updatedSuggestions.add(suggestion);
                continue;
            }

            Map<String, Object> change = approval.overrideChange() == null || approval.overrideChange().isEmpty()
                    ? suggestion.proposedChange()
                    : approval.overrideChange();
            UUID workItemId = UUID.fromString(suggestion.targetId());
            String nextStatus = stringValue(change.get("status"));
            String blockedReason = stringValue(change.get("blockedReason"));
            workItemStore.patch(workItemId, new InMemoryWorkItemStore.PatchInput(
                    null,
                    null,
                    nextStatus,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    blockedReason,
                    null
            ));
            workItemStore.recordActivity(workItemId, "DSU_APPLIED", request.actorId(), Map.of(
                    "dsuId", dsuId.toString(),
                    "suggestionId", suggestion.suggestionId().toString()
            ));
            applied++;
            updatedSuggestions.add(suggestion.withApproved(true));
        }

        suggestionsByDsu.put(dsuId, updatedSuggestions);
        applyLogsByDsu.computeIfAbsent(dsuId, ignored -> new ArrayList<>()).add(new DsuApplyLogView(
                UUID.randomUUID(),
                dsuId,
                entry.sprintId(),
                request.actorId(),
                applied,
                skipped,
                Instant.now().toString()
        ));
        return new DsuApplyResponse(dsuId, applied, skipped, "APPLIED");
    }

    @GetMapping("/api/v2/sprints/{sprintId}/backlog-items")
    public List<BacklogItemView> listBacklogV2(@PathVariable UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(backlogBySprint.getOrDefault(sprintId, List.of()));
    }

    @GetMapping("/api/v2/sprints/{sprintId}/day-plans")
    public List<DayPlanView> listDayPlans(@PathVariable UUID sprintId) {
        requireSprint(sprintId);
        return List.copyOf(dayPlansBySprint.getOrDefault(sprintId, List.of()));
    }

    @GetMapping("/api/v2/sprints/{sprintId}/dsu")
    public List<DsuEntryView> listDsuV2(@PathVariable UUID sprintId) {
        requireSprint(sprintId);
        return dsuEntries.values().stream().filter(entry -> entry.sprintId().equals(sprintId)).toList();
    }

    @GetMapping("/api/v2/dsu/reminders")
    public DsuReminderView reminder(@RequestParam String workspaceId,
                                    @RequestParam String projectId,
                                    @RequestParam String authorId) {
        UUID projectUuid = UUID.fromString(projectId);
        UUID sprintId = activeSprintByProject.get(projectUuid);
        if (sprintId == null) {
            return new DsuReminderView(
                    workspaceId,
                    projectId,
                    null,
                    authorId,
                    false,
                    "INFO",
                    "No active sprint",
                    "Start or select a sprint to activate DSU reminders.",
                    "/app/sprint?mode=planning",
                    null,
                    null);
        }

        SprintView sprint = requireSprint(sprintId);
        LocalDate todayUtc = LocalDate.now(ZoneOffset.UTC);
        DsuEntryView latestByAuthor = dsuEntries.values().stream()
                .filter(entry -> entry.projectId().equals(projectUuid))
                .filter(entry -> entry.sprintId().equals(sprintId))
                .filter(entry -> entry.authorId().equals(authorId))
                .max((left, right) -> left.createdAt().compareTo(right.createdAt()))
                .orElse(null);

        boolean submittedToday = latestByAuthor != null
                && Instant.parse(latestByAuthor.createdAt()).atZone(ZoneOffset.UTC).toLocalDate().equals(todayUtc);

        if (submittedToday) {
            return new DsuReminderView(
                    workspaceId,
                    projectId,
                    sprintId.toString(),
                    authorId,
                    false,
                    "INFO",
                    "DSU completed",
                    "Today's DSU is already submitted.",
                    "/app/sprint?mode=dsu",
                    todayUtc.toString(),
                    latestByAuthor.createdAt());
        }

        return new DsuReminderView(
                workspaceId,
                projectId,
                sprintId.toString(),
                authorId,
                true,
                "WARNING",
                "DSU pending",
                "오늘 DSU를 작성하고 AI 제안을 검토해 진행도를 반영하세요.",
                "/app/sprint?mode=dsu",
                sprint.endDate().toString(),
                latestByAuthor == null ? null : latestByAuthor.createdAt());
    }

    // Legacy compatibility endpoint
    @GetMapping("/api/agile/sprints/{sprintId}/backlog")
    public List<BacklogItemView> listBacklogLegacy(@PathVariable UUID sprintId) {
        return listBacklogV2(sprintId);
    }

    // Legacy compatibility endpoint
    @GetMapping("/api/agile/sprints/{sprintId}/dsu")
    public List<DSUView> listDsuLegacy(@PathVariable UUID sprintId) {
        return listDsuV2(sprintId).stream()
                .map(entry -> {
                    int blockerCount = estimateBlockerCount(entry.rawText());
                    return new DSUView(
                            entry.dsuId(),
                            entry.sprintId(),
                            entry.authorId(),
                            entry.rawText(),
                            blockerCount,
                            blockerCount > 0 ? "at_risk" : "on_track",
                            entry.createdAt());
                })
                .toList();
    }

    private UUID resolveSprintId(UUID projectId, String sprintIdCandidate) {
        if (sprintIdCandidate != null && !sprintIdCandidate.isBlank()) {
            return UUID.fromString(sprintIdCandidate);
        }
        UUID active = activeSprintByProject.get(projectId);
        if (active == null) {
            throw new IllegalArgumentException("NO_ACTIVE_SPRINT");
        }
        return active;
    }

    private void ensureNotFrozen(SprintView sprint) {
        if (sprint.freezeState()) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
    }

    private SprintView requireSprint(UUID sprintId) {
        SprintView sprint = sprints.get(sprintId);
        if (sprint == null) {
            throw new IllegalArgumentException("NO_ACTIVE_SPRINT");
        }
        return sprint;
    }

    private DayPlanView requireDayPlan(UUID dayPlanId) {
        DayPlanView dayPlan = dayPlanIndex.get(dayPlanId);
        if (dayPlan == null) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
        return dayPlan;
    }

    private DsuEntryView requireDsu(UUID dsuId) {
        DsuEntryView entry = dsuEntries.get(dsuId);
        if (entry == null) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
        return entry;
    }

    private void replaceDayPlanInSprint(UUID sprintId, DayPlanView updated) {
        List<DayPlanView> current = new ArrayList<>(dayPlansBySprint.getOrDefault(sprintId, List.of()));
        for (int i = 0; i < current.size(); i++) {
            if (current.get(i).dayPlanId().equals(updated.dayPlanId())) {
                current.set(i, updated);
                dayPlansBySprint.put(sprintId, current);
                return;
            }
        }
        current.add(updated);
        dayPlansBySprint.put(sprintId, current);
    }

    private int estimateBlockerCount(String text) {
        String raw = text == null ? "" : text.toLowerCase();
        if (raw.contains("blocked") || raw.contains("blocker") || raw.contains("대기") || raw.contains("승인") || raw.contains("막힘")) {
            return 1;
        }
        return 0;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    public record CreateSprintRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            @NotBlank String name,
            @NotBlank String goal,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            int capacitySp,
            Integer dailyCapacityMinutes
    ) {
    }

    public record AddBacklogItemRequest(@NotNull UUID workItemId, int rank, String status) {
    }

    public record GenerateDayPlanRequest(Integer dailyCapacityMinutes, Integer bufferMinutes) {
    }

    public record PatchDayPlanRequest(
            Integer plannedMinutes,
            Integer bufferMinutes,
            Boolean locked,
            List<DayPlanItemPatch> items
    ) {
    }

    public record DayPlanItemPatch(
            UUID dayPlanItemId,
            UUID workItemId,
            int plannedMinutes,
            int orderIndex
    ) {
    }

    public record FreezeSprintRequest(Boolean freeze) {
    }

    public record SubmitDsuRequest(@NotBlank String authorId, @NotBlank String rawText) {
    }

    public record DsuCreateRequest(
            @NotBlank String workspaceId,
            @NotBlank String projectId,
            String sprintId,
            @NotBlank String authorId,
            @NotBlank String rawText
    ) {
    }

    public record DsuSuggestRequest(String mode) {
    }

    public record DsuApplyRequest(
            @NotBlank String actorId,
            List<DsuApplyItem> suggestions
    ) {
    }

    public record DsuApplyItem(
            @NotNull UUID suggestionId,
            boolean approved,
            Map<String, Object> overrideChange
    ) {
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
            boolean freezeState,
            int dailyCapacityMinutes,
            String createdAt,
            String updatedAt
    ) {
        SprintView withDailyCapacityMinutes(int nextCapacity) {
            return new SprintView(
                    sprintId,
                    workspaceId,
                    projectId,
                    name,
                    goal,
                    startDate,
                    endDate,
                    capacitySp,
                    status,
                    freezeState,
                    nextCapacity,
                    createdAt,
                    Instant.now().toString());
        }
    }

    public record BacklogItemView(
            UUID backlogItemId,
            UUID sprintId,
            UUID workItemId,
            int rank,
            String status,
            String createdAt
    ) {
    }

    public record DayPlanView(
            UUID dayPlanId,
            UUID sprintId,
            LocalDate day,
            boolean locked,
            int plannedMinutes,
            int bufferMinutes,
            List<DayPlanItemView> items,
            String createdAt,
            String updatedAt
    ) {
    }

    public record DayPlanItemView(
            UUID dayPlanItemId,
            UUID dayPlanId,
            UUID workItemId,
            int plannedMinutes,
            int orderIndex
    ) {
    }

    public record DsuEntryView(
            UUID dsuId,
            UUID workspaceId,
            UUID projectId,
            UUID sprintId,
            String authorId,
            String rawText,
            String createdAt
    ) {
    }

    public record DsuSuggestionView(
            UUID suggestionId,
            UUID dsuId,
            String targetType,
            String targetId,
            Map<String, Object> proposedChange,
            double confidence,
            String reason,
            boolean approved
    ) {
        DsuSuggestionView withApproved(boolean value) {
            return new DsuSuggestionView(
                    suggestionId,
                    dsuId,
                    targetType,
                    targetId,
                    new LinkedHashMap<>(proposedChange),
                    confidence,
                    reason,
                    value);
        }
    }

    public record DsuApplyResponse(UUID dsuId, int appliedCount, int skippedCount, String status) {
    }

    public record DsuApplyLogView(
            UUID applyLogId,
            UUID dsuId,
            UUID sprintId,
            String actorId,
            int appliedCount,
            int skippedCount,
            String createdAt
    ) {
    }

    public record DsuReminderView(
            String workspaceId,
            String projectId,
            String sprintId,
            String authorId,
            boolean pending,
            String severity,
            String title,
            String message,
            String actionPath,
            String dueDate,
            String latestSubmittedAt
    ) {
    }

    // Legacy response
    public record DSUView(
            UUID dsuId,
            UUID sprintId,
            String authorId,
            String rawText,
            int blockerCount,
            String statusSignal,
            String createdAt
    ) {
    }
}
