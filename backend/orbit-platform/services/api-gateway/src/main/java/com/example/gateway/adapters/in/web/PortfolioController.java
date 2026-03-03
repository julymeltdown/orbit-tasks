package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    @PostMapping("/overview")
    public PortfolioOverviewResponse overview(@Valid @RequestBody PortfolioOverviewRequest request) {
        int healthy = (int) request.projects().stream().filter(p -> "healthy".equalsIgnoreCase(p.health())).count();
        int warning = (int) request.projects().stream().filter(p -> "warning".equalsIgnoreCase(p.health())).count();
        int atRisk = request.projects().size() - healthy - warning;

        List<EscalationCandidate> candidates = request.projects().stream()
                .map(project -> new EscalationCandidate(
                        project.projectId(),
                        project.projectName(),
                        project.riskScore(),
                        project.blockerCount(),
                        project.owner(),
                        project.riskScore() > 70 ? "Immediate escalation" : "Monitor"))
                .sorted(Comparator.comparingDouble(EscalationCandidate::riskScore).reversed())
                .limit(10)
                .toList();

        return new PortfolioOverviewResponse(
                request.workspaceId(),
                request.portfolioId(),
                request.periodStart(),
                request.periodEnd(),
                healthy,
                warning,
                atRisk,
                candidates);
    }

    @GetMapping("/monthly-report")
    public MonthlyReportResponse monthlyReport(@RequestParam String portfolioId) {
        String csv = "portfolio_id,healthy,warning,at_risk\n" + portfolioId + ",4,2,1\n";
        return new MonthlyReportResponse(
                portfolioId,
                LocalDate.now().withDayOfMonth(1),
                "Executive summary generated",
                csv);
    }

    public record PortfolioOverviewRequest(
            @NotBlank String workspaceId,
            @NotBlank String portfolioId,
            LocalDate periodStart,
            LocalDate periodEnd,
            List<ProjectInput> projects
    ) {
    }

    public record ProjectInput(String projectId, String projectName, String health, double riskScore, int blockerCount, String owner) {
    }

    public record EscalationCandidate(String projectId, String projectName, double riskScore, int blockerCount, String owner, String recommendation) {
    }

    public record PortfolioOverviewResponse(
            String workspaceId,
            String portfolioId,
            LocalDate periodStart,
            LocalDate periodEnd,
            int healthyProjects,
            int warningProjects,
            int atRiskProjects,
            List<EscalationCandidate> escalationCandidates
    ) {
    }

    public record MonthlyReportResponse(String portfolioId, LocalDate month, String headline, String csv) {
    }
}
