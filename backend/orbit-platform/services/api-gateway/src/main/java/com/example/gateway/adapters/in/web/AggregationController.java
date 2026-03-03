package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.aggregation.AggregationResponse;
import com.example.gateway.application.service.AggregationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aggregate")
public class AggregationController {
    private final AggregationService aggregationService;

    public AggregationController(AggregationService aggregationService) {
        this.aggregationService = aggregationService;
    }

    @GetMapping("/{routeKey}")
    public AggregationResponse aggregate(@PathVariable String routeKey) {
        return aggregationService.aggregate(routeKey);
    }
}
