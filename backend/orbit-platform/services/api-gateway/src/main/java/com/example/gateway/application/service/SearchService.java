package com.example.gateway.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class SearchService {
    private final InMemoryWorkItemStore workItemStore;

    public SearchService(InMemoryWorkItemStore workItemStore) {
        this.workItemStore = workItemStore;
    }

    public SearchResponse search(String workspaceId, String projectId, String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2) {
            return new SearchResponse(normalized, List.of());
        }

        List<SearchResult> results = new ArrayList<>();
        String lowered = normalized.toLowerCase(Locale.ROOT);

        results.addAll(workItemStore.list(projectId, null, null, normalized, null).stream()
                .limit(8)
                .map(item -> new SearchResult(
                        item.workItemId().toString(),
                        "WORK_ITEM",
                        item.title(),
                        buildSubtitle(item.status(), item.assignee(), item.dueAt()),
                        "/app/projects/board?focus=" + item.workItemId(),
                        "task"))
                .toList());

        if ("보드".contains(normalized) || lowered.contains("board")) {
            results.add(destination("destination-board", "보드 열기", "현재 프로젝트의 기본 실행 화면", "/app/projects/board", "view_kanban"));
        }
        if ("스프린트".contains(normalized) || lowered.contains("sprint")) {
            results.add(destination("destination-sprint", "스프린트 열기", "계획과 DSU 리뷰를 진행합니다", "/app/sprint?mode=planning", "event_note"));
        }
        if ("인사이트".contains(normalized) || lowered.contains("insight")) {
            results.add(destination("destination-insights", "인사이트 열기", "일정 평가와 Draft 대응 전략을 확인합니다", "/app/insights", "psychology"));
        }
        if ("인박스".contains(normalized) || lowered.contains("inbox")) {
            results.add(destination("destination-inbox", "인박스 열기", "멘션, 요청, AI 질문을 triage 합니다", "/app/inbox", "inbox"));
        }

        return new SearchResponse(normalized, results.stream().limit(12).toList());
    }

    private SearchResult destination(String id, String title, String subtitle, String path, String icon) {
        return new SearchResult(id, "DESTINATION", title, subtitle, path, icon);
    }

    private String buildSubtitle(String status, String assignee, String dueAt) {
        List<String> parts = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            parts.add(status.replace('_', ' '));
        }
        if (assignee != null && !assignee.isBlank()) {
            parts.add("담당 " + assignee);
        }
        if (dueAt != null && !dueAt.isBlank()) {
            parts.add("마감 " + dueAt);
        }
        return parts.isEmpty() ? "작업 결과" : String.join(" · ", parts);
    }

    public record SearchResponse(String query, List<SearchResult> results) {
    }

    public record SearchResult(String id, String type, String title, String subtitle, String path, String icon) {
    }
}
