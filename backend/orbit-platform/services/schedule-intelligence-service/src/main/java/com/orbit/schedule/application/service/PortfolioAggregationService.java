package com.orbit.schedule.application.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PortfolioAggregationService {

    public PortfolioSummary aggregate(UUID workspaceId,
                                      UUID portfolioId,
                                      LocalDate from,
                                      LocalDate to,
                                      List<ProjectHealthInput> projects) {
        long healthy = projects.stream().filter(p -> "healthy".equalsIgnoreCase(p.health())).count();
        long warning = projects.stream().filter(p -> "warning".equalsIgnoreCase(p.health())).count();
        long atRisk = projects.stream().filter(p -> "at_risk".equalsIgnoreCase(p.health())).count();

        List<EscalationCandidate> candidates = projects.stream()
                .map(project -> new EscalationCandidate(
                        UUID.randomUUID().toString(),
                        project.projectId(),
                        project.projectName(),
                        project.riskScore(),
                        project.blockerCount(),
                        project.owner(),
                        project.riskScore() > 70 ? "Escalate to program review" : "Track in weekly sync"))
                .sorted(Comparator.comparingDouble(EscalationCandidate::riskScore).reversed())
                .limit(10)
                .toList();

        return new PortfolioSummary(
                workspaceId.toString(),
                portfolioId.toString(),
                from,
                to,
                (int) healthy,
                (int) warning,
                (int) atRisk,
                candidates);
    }

    public record ProjectHealthInput(String projectId, String projectName, String health, double riskScore, int blockerCount, String owner) {
    }

    public record EscalationCandidate(String candidateId, String projectId, String projectName, double riskScore, int blockerCount, String owner, String recommendation) {
    }

    public record PortfolioSummary(
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
}
