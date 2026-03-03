package com.orbit.schedule.application.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DeterministicRiskEngine {

    public DeterministicResult evaluate(Metrics metrics) {
        double loadRatio = metrics.remainingStoryPoints() == 0
                ? 0.0
                : (double) metrics.remainingStoryPoints() / Math.max(metrics.availableCapacitySp(), 1);

        List<RiskSignal> risks = new ArrayList<>();
        if (loadRatio > 1.0) {
            risks.add(new RiskSignal("capacity_overload", "Remaining scope exceeds available sprint capacity", "high"));
        }
        if (metrics.blockedCount() > 0) {
            risks.add(new RiskSignal("blocked_work", "Blocked work item exists on active schedule graph", "high"));
        }
        if (metrics.atRiskCount() > 0) {
            risks.add(new RiskSignal("at_risk_items", "At-risk items detected in DSU/work graph", "medium"));
        }

        double score = Math.max(0, 100 - (loadRatio * 24) - (metrics.blockedCount() * 18) - (metrics.atRiskCount() * 8));
        String health = score >= 80 ? "healthy" : score >= 60 ? "warning" : "at_risk";

        return new DeterministicResult(health, score, risks);
    }

    public record Metrics(int remainingStoryPoints, int availableCapacitySp, int blockedCount, int atRiskCount) {
    }

    public record RiskSignal(String type, String summary, String urgency) {
    }

    public record DeterministicResult(String health, double score, List<RiskSignal> risks) {
    }
}
