package com.orbit.schedule.application.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExecutiveReportService {

    public MonthlyReport generate(PortfolioAggregationService.PortfolioSummary summary,
                                  List<String> strategicRisks,
                                  List<String> requiredDecisions) {
        String headline = summary.atRiskProjects() > 0
                ? "납기 위험 프로젝트가 존재합니다"
                : "포트폴리오 일정은 안정적입니다";

        return new MonthlyReport(
                LocalDate.now().withDayOfMonth(1),
                headline,
                summary,
                strategicRisks,
                requiredDecisions,
                csv(summary));
    }

    private String csv(PortfolioAggregationService.PortfolioSummary summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("portfolio_id,healthy,warning,at_risk\n");
        sb.append(summary.portfolioId()).append(',')
                .append(summary.healthyProjects()).append(',')
                .append(summary.warningProjects()).append(',')
                .append(summary.atRiskProjects()).append('\n');
        summary.escalationCandidates().forEach(candidate -> sb
                .append(candidate.projectId()).append(',')
                .append(candidate.projectName()).append(',')
                .append(candidate.riskScore()).append(',')
                .append(candidate.blockerCount()).append('\n'));
        return sb.toString();
    }

    public record MonthlyReport(
            LocalDate month,
            String headline,
            PortfolioAggregationService.PortfolioSummary summary,
            List<String> strategicRisks,
            List<String> requiredDecisions,
            String csvExport
    ) {
    }
}
