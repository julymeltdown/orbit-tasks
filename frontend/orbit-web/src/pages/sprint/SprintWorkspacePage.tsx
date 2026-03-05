import { useCallback, useEffect, useMemo, useState } from "react";
import { DSUComposerPanel, type DSUComposePayload, type DSUSummary } from "@/components/agile/DSUComposerPanel";
import { DSUSuggestionReviewPanel } from "@/components/agile/DSUSuggestionReviewPanel";
import { SprintWizardStepBacklog } from "@/components/agile/SprintWizardStepBacklog";
import { SprintWizardStepDayPlan } from "@/components/agile/SprintWizardStepDayPlan";
import { SprintWizardStepInfo } from "@/components/agile/SprintWizardStepInfo";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { useDsuSuggestions } from "@/features/agile/hooks/useDsuSuggestions";
import { type BacklogItemView, type DayPlanView, type SprintView, useSprintPlanning } from "@/features/agile/hooks/useSprintPlanning";
import type { DSUSuggestion } from "@/features/workitems/types";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";

type WizardStep = 1 | 2 | 3;

interface SprintDsuEntry {
  dsuId: string;
  authorId: string;
  rawText: string;
  createdAt: string;
}

function hasBlockerSignal(text: string): boolean {
  const lowered = text.toLowerCase();
  return lowered.includes("block") || lowered.includes("막힘") || lowered.includes("대기") || lowered.includes("승인");
}

export function SprintWorkspacePage() {
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const setProjectFilter = useProjectViewStore((state) => state.setFilter);
  const { items: workItems, load: reloadWorkItems } = useWorkItems(projectId);
  const { activeSprint, setActiveSprint } = useActiveSprint(activeWorkspaceId, projectId);
  const sprintPlanning = useSprintPlanning();
  const dsuApi = useDsuSuggestions();

  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sprintName, setSprintName] = useState("Sprint Orbit");
  const [goal, setGoal] = useState("핵심 릴리스 범위 완료");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [capacitySp, setCapacitySp] = useState(18);
  const [dailyCapacityMinutes, setDailyCapacityMinutes] = useState(360);

  const [sprint, setSprint] = useState<SprintView | null>(null);
  const [backlog, setBacklog] = useState<BacklogItemView[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlanView[]>([]);
  const [dsuHistory, setDsuHistory] = useState<SprintDsuEntry[]>([]);
  const [suggestions, setSuggestions] = useState<DSUSuggestion[]>([]);
  const [lastDsuId, setLastDsuId] = useState<string | null>(null);
  const sprintEmptyState = getGuidedEmptyState("SPRINT");

  const canCreateSprint = useMemo(() => {
    return Boolean(activeWorkspaceId && projectId && sprintName.trim() && goal.trim() && startDate && endDate);
  }, [activeWorkspaceId, projectId, sprintName, goal, startDate, endDate]);

  const emitActivationEvent = useCallback(
    async (eventType: "SPRINT_ENTERED" | "EMPTY_STATE_ACTION_CLICKED", metadata?: Record<string, unknown>) => {
      if (!activeWorkspaceId) {
        return;
      }
      await trackActivationEvent({
        workspaceId: activeWorkspaceId,
        projectId,
        userId,
        eventType,
        route: "/app/sprint",
        metadata
      });
    },
    [activeWorkspaceId, projectId, userId]
  );

  async function loadSprintContext(sprintId: string) {
    const [nextBacklog, nextDayPlans, nextDsu] = await Promise.all([
      sprintPlanning.listBacklog(sprintId),
      sprintPlanning.listDayPlans(sprintId),
      sprintPlanning.listSprintDsu(sprintId)
    ]);
    setBacklog(nextBacklog);
    setDayPlans(nextDayPlans);
    setDsuHistory(nextDsu);
  }

  useEffect(() => {
    if (!activeWorkspaceId || !projectId || !activeSprint?.sprintId) {
      return;
    }
    setSprint((current) => {
      if (current?.sprintId === activeSprint.sprintId) {
        return current;
      }
      return {
        sprintId: activeSprint.sprintId,
        workspaceId: activeWorkspaceId,
        projectId,
        name: activeSprint.name,
        goal: activeSprint.goal,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
        capacitySp: activeSprint.capacitySp,
        status: "ACTIVE",
        freezeState: false,
        dailyCapacityMinutes: dailyCapacityMinutes,
        createdAt: activeSprint.updatedAt,
        updatedAt: activeSprint.updatedAt
      };
    });
    setSprintName(activeSprint.name);
    setGoal(activeSprint.goal);
    setStartDate(activeSprint.startDate);
    setEndDate(activeSprint.endDate);
    loadSprintContext(activeSprint.sprintId).catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load sprint context");
    });
    emitActivationEvent("SPRINT_ENTERED", { source: "active_sprint_restore", sprintId: activeSprint.sprintId }).catch(() => undefined);
  }, [activeWorkspaceId, projectId, activeSprint?.sprintId, emitActivationEvent, dailyCapacityMinutes, setProjectFilter, setActiveSprint]);

  async function createSprintAndContinue() {
    if (!activeWorkspaceId) {
      setError("No active workspace selected");
      return;
    }
    if (!canCreateSprint) {
      setError("Fill all sprint fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await sprintPlanning.createSprint({
        workspaceId: activeWorkspaceId,
        projectId,
        name: sprintName.trim(),
        goal: goal.trim(),
        startDate,
        endDate,
        capacitySp,
        dailyCapacityMinutes
      });
      setSprint(created);
      setActiveSprint({
        sprintId: created.sprintId,
        name: created.name,
        goal: created.goal,
        startDate: created.startDate,
        endDate: created.endDate,
        capacitySp: created.capacitySp,
        updatedAt: created.updatedAt
      });
      await loadSprintContext(created.sprintId);
      setProjectFilter(projectId, "sprintOnly", true);
      setStep(2);
      await emitActivationEvent("SPRINT_ENTERED", { source: "wizard_create", sprintId: created.sprintId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create sprint");
    } finally {
      setLoading(false);
    }
  }

  async function addBacklogItem(workItemId: string) {
    if (!sprint) {
      return;
    }
    const nextRank = backlog.length > 0 ? Math.max(...backlog.map((entry) => entry.rank)) + 1 : 1;
    setLoading(true);
    setError(null);
    try {
      await sprintPlanning.addBacklogItem(sprint.sprintId, {
        workItemId,
        rank: nextRank,
        status: "READY"
      });
      await loadSprintContext(sprint.sprintId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add backlog item");
    } finally {
      setLoading(false);
    }
  }

  async function generateDayPlan() {
    if (!sprint) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const generated = await sprintPlanning.generateDayPlan(sprint.sprintId, {
        dailyCapacityMinutes
      });
      setDayPlans(generated);
      if (generated.length > 0) {
        setStep(3);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate day plan");
    } finally {
      setLoading(false);
    }
  }

  async function patchDayPlan(dayPlanId: string, patch: { plannedMinutes?: number; bufferMinutes?: number; locked?: boolean }) {
    setError(null);
    try {
      const updated = await sprintPlanning.patchDayPlan(dayPlanId, patch);
      setDayPlans((prev) => prev.map((plan) => (plan.dayPlanId === updated.dayPlanId ? updated : plan)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update day plan");
    }
  }

  async function freezeSprintPlan() {
    if (!sprint) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await sprintPlanning.freezeSprint(sprint.sprintId, true);
      setSprint(updated);
      setProjectFilter(projectId, "sprintOnly", true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to freeze sprint");
    } finally {
      setLoading(false);
    }
  }

  async function submitDsu(payload: DSUComposePayload): Promise<DSUSummary> {
    if (!sprint || !activeWorkspaceId) {
      throw new Error("Sprint not initialized");
    }
    const entry = await dsuApi.createDsu({
      workspaceId: activeWorkspaceId,
      projectId,
      sprintId: sprint.sprintId,
      authorId: userId,
      rawText: payload.rawText
    });
    const nextSuggestions = await dsuApi.suggest(entry.dsuId);
    setLastDsuId(entry.dsuId);
    setSuggestions(nextSuggestions);
    await loadSprintContext(sprint.sprintId);

    const blockerCount = hasBlockerSignal(payload.rawText) ? 1 : 0;
    return {
      dsuId: entry.dsuId,
      blockerCount,
      statusSignal: blockerCount > 0 ? "at_risk" : "on_track",
      asks: payload.asks.trim() ? [payload.asks.trim()] : []
    };
  }

  async function applySuggestions(items: Array<{ suggestionId: string; approved: boolean; overrideChange?: Record<string, unknown> }>) {
    if (!lastDsuId) {
      throw new Error("No DSU suggestion to apply");
    }
    setApplying(true);
    setError(null);
    try {
      await dsuApi.apply(lastDsuId, userId, items);
      if (sprint) {
        await loadSprintContext(sprint.sprintId);
      }
      await reloadWorkItems();
      setSuggestions((prev) => prev.map((item) => ({ ...item, approved: items.find((target) => target.suggestionId === item.suggestionId)?.approved ?? item.approved })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply DSU suggestions");
      throw e;
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="orbit-sprint-shell">
      {!sprint ? (
        <EmptyStateCard
          title={sprintEmptyState.title}
          description={sprintEmptyState.description}
          statusHint={sprintEmptyState.statusHint}
          actions={[
            {
              label: sprintEmptyState.primaryAction.label,
              onClick: () => {
                emitActivationEvent("EMPTY_STATE_ACTION_CLICKED", { scope: "SPRINT", action: "create_sprint" }).catch(() => undefined);
                setStep(1);
              }
            }
          ]}
          secondaryActions={[
            {
              label: "Open Board",
              variant: "ghost",
              onClick: () => setProjectFilter(projectId, "sprintOnly", false)
            }
          ]}
        />
      ) : null}

      {error ? (
        <article className="orbit-sprint-banner">
          <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p>
        </article>
      ) : null}

      <article className="orbit-sprint-banner">
        <h2 style={{ marginTop: 0 }}>Sprint Wizard</h2>
        <p style={{ marginTop: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          Step {step} / 3 · Plan → Backlog → Day Plan Freeze
        </p>
      </article>

      {step === 1 ? (
        <SprintWizardStepInfo
          sprintName={sprintName}
          goal={goal}
          startDate={startDate}
          endDate={endDate}
          capacitySp={capacitySp}
          dailyCapacityMinutes={dailyCapacityMinutes}
          loading={loading}
          onChange={(patch) => {
            if (patch.sprintName !== undefined) setSprintName(patch.sprintName);
            if (patch.goal !== undefined) setGoal(patch.goal);
            if (patch.startDate !== undefined) setStartDate(patch.startDate);
            if (patch.endDate !== undefined) setEndDate(patch.endDate);
            if (patch.capacitySp !== undefined) setCapacitySp(patch.capacitySp);
            if (patch.dailyCapacityMinutes !== undefined) setDailyCapacityMinutes(patch.dailyCapacityMinutes);
          }}
          onNext={createSprintAndContinue}
        />
      ) : null}

      {step === 2 ? (
        <SprintWizardStepBacklog
          workItems={workItems}
          backlog={backlog}
          loading={loading}
          onAddBacklog={addBacklogItem}
          onPrevious={() => setStep(1)}
          onNext={() => {
            setStep(3);
            if (dayPlans.length === 0) {
              generateDayPlan().catch(() => undefined);
            }
          }}
        />
      ) : null}

      {step === 3 ? (
        <SprintWizardStepDayPlan
          workItems={workItems}
          dayPlans={dayPlans}
          freezeState={Boolean(sprint?.freezeState)}
          loading={loading}
          onGenerate={generateDayPlan}
          onPatch={patchDayPlan}
          onFreeze={freezeSprintPlan}
          onPrevious={() => setStep(2)}
        />
      ) : null}

      <section className="orbit-sprint-dsu-grid">
        <DSUComposerPanel onSubmit={submitDsu} />
        <DSUSuggestionReviewPanel suggestions={suggestions} applying={applying} onApply={applySuggestions} />
      </section>

      <article className="orbit-sprint-history">
        <h3 style={{ marginTop: 0 }}>DSU History</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {dsuHistory.map((entry) => (
            <div key={entry.dsuId} className="orbit-sprint-history__item orbit-animate-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{entry.authorId}</strong>
                <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{entry.rawText}</p>
            </div>
          ))}
          {dsuHistory.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No DSU submitted yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
