import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { getDsuLockReason, getSprintModeSummary, getSprintReadinessLabel, type SprintMode } from "@/features/agile/sprintMode";

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

function parseMode(value: string | null): SprintMode | null {
  if (value === "planning" || value === "dsu") {
    return value;
  }
  return null;
}

export function SprintWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const queryMode = parseMode(searchParams.get("mode"));
  const defaultMode: SprintMode = !activeSprint?.sprintId ? "planning" : sprint?.freezeState ? "dsu" : "planning";
  const mode = queryMode ?? defaultMode;
  const hasActiveSprint = Boolean(sprint);
  const dsuLocked = !hasActiveSprint || !sprint?.freezeState;
  const dsuLockedReason = getDsuLockReason(sprint) ?? undefined;
  const modeSummary = getSprintModeSummary(mode, sprint, backlog.length, dayPlans.length);
  const readinessLabel = getSprintReadinessLabel(sprint, backlog.length, dayPlans.length);
  const workItemTitleById = useMemo(
    () =>
      Object.fromEntries(
        workItems.map((item) => [item.workItemId, item.title])
      ),
    [workItems]
  );

  const canCreateSprint = useMemo(() => {
    return Boolean(activeWorkspaceId && projectId && sprintName.trim() && goal.trim() && startDate && endDate);
  }, [activeWorkspaceId, projectId, sprintName, goal, startDate, endDate]);

  const setMode = useCallback(
    (nextMode: SprintMode) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("mode", nextMode);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

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
    const nextStep: WizardStep = nextDayPlans.length > 0 ? 3 : nextBacklog.length > 0 ? 2 : 1;
    setStep(nextStep);
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
  }, [activeWorkspaceId, projectId, activeSprint?.sprintId, emitActivationEvent, dailyCapacityMinutes, setActiveSprint]);

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
      setMode("planning");
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
      setMode("dsu");
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
      setSuggestions((prev) =>
        prev.map((item) => ({ ...item, approved: items.find((target) => target.suggestionId === item.suggestionId)?.approved ?? item.approved }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply DSU suggestions");
      throw e;
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="orbit-sprint-shell">
      <header className="orbit-sprint-hero">
        <p className="orbit-sprint-hero__eyebrow">{modeSummary.eyebrow}</p>
        <h2 style={{ margin: 0 }}>{modeSummary.title}</h2>
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>{modeSummary.description}</p>
        <div className="orbit-sprint-hero__chips" aria-label="Sprint flow stage">
          <span className={`orbit-sprint-chip${mode === "planning" ? " is-active" : ""}`}>1. Planning</span>
          <span className={`orbit-sprint-chip${sprint?.freezeState ? " is-active" : ""}`}>2. Freeze</span>
          <span className={`orbit-sprint-chip${mode === "dsu" ? " is-active" : ""}`}>3. DSU Execution</span>
        </div>
        <div className="orbit-sprint-hero__status">
          <strong>{sprint?.name ?? "No active sprint"}</strong>
          <span>{readinessLabel}</span>
          <span>{modeSummary.nextStep}</span>
        </div>
      </header>

      {error ? (
        <article className="orbit-sprint-inline-note">
          <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p>
        </article>
      ) : null}

      <nav className="orbit-sprint-mode-tabs" role="tablist" aria-label="Sprint modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "planning"}
          className={`orbit-link-button orbit-link-button--tab${mode === "planning" ? " is-active" : ""}`}
          onClick={() => setMode("planning")}
        >
          Planning
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "dsu"}
          className={`orbit-link-button orbit-link-button--tab${mode === "dsu" ? " is-active" : ""}`}
          onClick={() => setMode("dsu")}
        >
          DSU Review
          {dsuLocked ? <span className="orbit-notice-badge">!</span> : null}
        </button>
      </nav>

      {mode === "planning" ? (
        <section className="orbit-sprint-section" role="tabpanel" aria-label="Planning mode">
          {!sprint ? (
            <>
              <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>활성 스프린트가 아직 없습니다.</p>
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
                    label: "보드 보기",
                    variant: "ghost",
                    onClick: () => setProjectFilter(projectId, "sprintOnly", false)
                  }
                ]}
              />
            </>
          ) : null}

          <header className="orbit-sprint-section__head">
            <h3 style={{ margin: 0 }}>Sprint Wizard</h3>
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
              Step {step} / 3 · Info → Backlog → Day Plan Freeze
            </p>
          </header>

          <div className="orbit-sprint-step-tabs" role="tablist" aria-label="Wizard step">
            <button type="button" className={`orbit-link-button orbit-link-button--tab${step === 1 ? " is-active" : ""}`} onClick={() => setStep(1)}>
              1. Info
            </button>
            <button
              type="button"
              className={`orbit-link-button orbit-link-button--tab${step === 2 ? " is-active" : ""}`}
              onClick={() => setStep(2)}
              disabled={!sprint}
            >
              2. Backlog
            </button>
            <button
              type="button"
              className={`orbit-link-button orbit-link-button--tab${step === 3 ? " is-active" : ""}`}
              onClick={() => setStep(3)}
              disabled={!sprint}
            >
              3. Day Plan
            </button>
          </div>

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
        </section>
      ) : null}

      {mode === "dsu" ? (
        <section className="orbit-sprint-section" role="tabpanel" aria-label="DSU mode">
          <header className="orbit-sprint-section__head">
            <h3 style={{ margin: 0 }}>DSU + AI Suggestion Review</h3>
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
              DSU를 입력하고, AI draft를 읽고, 승인한 항목만 반영합니다.
            </p>
          </header>

          {dsuLocked ? (
            <article className="orbit-sprint-inline-note orbit-sprint-inline-note--warning">
              <strong>{hasActiveSprint ? "Sprint plan이 아직 freeze되지 않았습니다" : "활성 스프린트가 없습니다"}</strong>
              <p style={{ margin: 0 }}>{dsuLockedReason}</p>
              <div>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setMode("planning")}>
                  Planning 열기
                </button>
              </div>
            </article>
          ) : null}

          <article className="orbit-sprint-inline-note">
            <strong>현재 루프 설명</strong>
            <p style={{ margin: 0 }}>
              DSU는 오늘 계획 대비 실제 진척을 검토하기 위한 입력입니다. AI는 초안만 제안하고, 승인 전에는 아무 것도 적용되지 않습니다.
            </p>
          </article>

          <section className="orbit-sprint-dsu-grid">
            <DSUComposerPanel onSubmit={submitDsu} disabled={dsuLocked} disabledReason={dsuLockedReason} />
            <DSUSuggestionReviewPanel
              suggestions={suggestions}
              applying={applying}
              onApply={applySuggestions}
              disabled={dsuLocked}
              disabledReason={dsuLockedReason}
              workItemTitleById={workItemTitleById}
            />
          </section>

          <section className="orbit-sprint-history">
            <h3 style={{ marginTop: 0 }}>DSU History</h3>
            <div className="orbit-sprint-history__list">
              {dsuHistory.map((entry) => (
                <div key={entry.dsuId} className="orbit-sprint-history__item orbit-animate-row">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>{entry.authorId}</strong>
                    <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{entry.rawText}</p>
                </div>
              ))}
              {dsuHistory.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>아직 제출된 DSU가 없습니다.</p> : null}
            </div>
          </section>
        </section>
      ) : null}
    </section>
  );
}
