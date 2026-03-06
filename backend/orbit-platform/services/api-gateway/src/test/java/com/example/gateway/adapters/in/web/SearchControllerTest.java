package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.SearchService;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SearchControllerTest {
    @Test
    void returnsSearchResults() {
        SearchService searchService = mock(SearchService.class);
        SearchController controller = new SearchController(searchService);
        SearchService.SearchResponse expected = new SearchService.SearchResponse(
                "board",
                List.of(new SearchService.SearchResult(
                        "destination-board",
                        "DESTINATION",
                        "보드 열기",
                        "현재 프로젝트의 기본 실행 화면",
                        "/app/projects/board",
                        "view_kanban"
                ))
        );
        when(searchService.search("workspace-1", "project-1", "board")).thenReturn(expected);

        SearchService.SearchResponse response = controller.search("workspace-1", "project-1", "board");

        assertEquals("board", response.query());
        assertEquals(1, response.results().size());
        assertEquals("DESTINATION", response.results().get(0).type());
    }
}
