package com.example.gateway.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "schedule_evaluation")
public class ScheduleEvaluationEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "evaluation_id", nullable = false, unique = true, length = 64)
    private String evaluationId;

    @Column(name = "workspace_id", nullable = false, length = 64)
    private String workspaceId;

    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    @Column(name = "sprint_id", length = 64)
    private String sprintId;

    @Column(name = "selected_work_item_id", length = 64)
    private String selectedWorkItemId;

    @Lob
    @Column(name = "prompt_text")
    private String prompt;

    @Column(name = "health", nullable = false, length = 32)
    private String health;

    @Lob
    @Column(name = "top_risks_json", nullable = false)
    private String topRisksJson;

    @Lob
    @Column(name = "questions_json", nullable = false)
    private String questionsJson;

    @Lob
    @Column(name = "actions_json", nullable = false)
    private String actionsJson;

    @Column(name = "confidence", nullable = false)
    private double confidence;

    @Column(name = "fallback_flag", nullable = false)
    private boolean fallback;

    @Column(name = "reason", nullable = false, length = 128)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEvaluationId() {
        return evaluationId;
    }

    public void setEvaluationId(String evaluationId) {
        this.evaluationId = evaluationId;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(String workspaceId) {
        this.workspaceId = workspaceId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getSprintId() {
        return sprintId;
    }

    public void setSprintId(String sprintId) {
        this.sprintId = sprintId;
    }

    public String getSelectedWorkItemId() {
        return selectedWorkItemId;
    }

    public void setSelectedWorkItemId(String selectedWorkItemId) {
        this.selectedWorkItemId = selectedWorkItemId;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getHealth() {
        return health;
    }

    public void setHealth(String health) {
        this.health = health;
    }

    public String getTopRisksJson() {
        return topRisksJson;
    }

    public void setTopRisksJson(String topRisksJson) {
        this.topRisksJson = topRisksJson;
    }

    public String getQuestionsJson() {
        return questionsJson;
    }

    public void setQuestionsJson(String questionsJson) {
        this.questionsJson = questionsJson;
    }

    public String getActionsJson() {
        return actionsJson;
    }

    public void setActionsJson(String actionsJson) {
        this.actionsJson = actionsJson;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public boolean isFallback() {
        return fallback;
    }

    public void setFallback(boolean fallback) {
        this.fallback = fallback;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
