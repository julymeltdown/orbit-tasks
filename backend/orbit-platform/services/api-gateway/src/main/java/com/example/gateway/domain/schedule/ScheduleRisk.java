package com.example.gateway.domain.schedule;

import java.util.List;

public record ScheduleRisk(
        String type,
        String summary,
        String impact,
        List<String> recommendedActions,
        List<String> evidence
) {
}
