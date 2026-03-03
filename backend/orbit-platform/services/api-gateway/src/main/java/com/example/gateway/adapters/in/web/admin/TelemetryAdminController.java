package com.example.gateway.adapters.in.web.admin;

import com.example.gateway.application.dto.telemetry.TelemetrySummary;
import com.example.gateway.application.service.TelemetryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/telemetry")
public class TelemetryAdminController {
    private final TelemetryService telemetryService;

    public TelemetryAdminController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping("/summary")
    public TelemetrySummary summary() {
        return telemetryService.summary();
    }
}
