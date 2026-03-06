package com.example.gateway.adapters.in.web;

import com.example.gateway.application.service.SearchService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/search")
public class SearchController {
    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchService.SearchResponse search(@RequestParam @NotBlank String workspaceId,
                                               @RequestParam @NotBlank String projectId,
                                               @RequestParam(name = "q") @NotBlank String query) {
        return searchService.search(workspaceId, projectId, query);
    }
}
