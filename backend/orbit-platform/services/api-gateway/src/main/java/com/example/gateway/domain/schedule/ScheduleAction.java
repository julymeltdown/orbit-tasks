package com.example.gateway.domain.schedule;

public record ScheduleAction(
        String actionId,
        String label,
        String status,
        String note
) {
}
