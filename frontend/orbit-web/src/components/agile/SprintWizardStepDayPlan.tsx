import { displayWorkItemTitle } from "@/features/workitems/display";
import type { WorkItem } from "@/features/workitems/types";
import type { DayPlanView } from "@/features/agile/hooks/useSprintPlanning";

interface Props {
  workItems: WorkItem[];
  dayPlans: DayPlanView[];
  freezeState: boolean;
  loading: boolean;
  onGenerate: () => Promise<void>;
  onPatch: (dayPlanId: string, patch: { plannedMinutes?: number; bufferMinutes?: number; locked?: boolean }) => Promise<void>;
  onFreeze: () => Promise<void>;
  onPrevious: () => void;
}

export function SprintWizardStepDayPlan({
  workItems,
  dayPlans,
  freezeState,
  loading,
  onGenerate,
  onPatch,
  onFreeze,
  onPrevious
}: Props) {
  const titleById = new Map(workItems.map((item) => [item.workItemId, displayWorkItemTitle(item.title)]));

  return (
    <section className="orbit-sprint-step">
      <h3 style={{ margin: 0 }}>Step 3 · Day Plan Draft & Freeze</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onGenerate} disabled={loading || freezeState}>
          {loading ? "Generating..." : "Generate Draft"}
        </button>
        <button className="orbit-button" type="button" onClick={onFreeze} disabled={loading || freezeState || dayPlans.length === 0}>
          {freezeState ? "Frozen" : "Freeze Sprint Plan"}
        </button>
      </div>

      <div className="orbit-sprint-dayplan-list">
        {dayPlans.map((plan) => (
          <article key={plan.dayPlanId} className="orbit-sprint-day-row">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <strong>{new Date(plan.day).toLocaleDateString()}</strong>
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                {plan.locked ? "Locked" : "Editable"} · {plan.items.length} tasks
              </span>
            </div>
            <div className="orbit-sprint-form-grid">
              <label className="orbit-sprint-field">
                <span>Planned minutes</span>
                <input
                  className="orbit-input"
                  type="number"
                  min={30}
                  value={plan.plannedMinutes}
                  onChange={(event) => onPatch(plan.dayPlanId, { plannedMinutes: Number(event.target.value) })}
                  disabled={freezeState || loading}
                />
              </label>
              <label className="orbit-sprint-field">
                <span>Buffer minutes</span>
                <input
                  className="orbit-input"
                  type="number"
                  min={0}
                  value={plan.bufferMinutes}
                  onChange={(event) => onPatch(plan.dayPlanId, { bufferMinutes: Number(event.target.value) })}
                  disabled={freezeState || loading}
                />
              </label>
            </div>
            <ul className="orbit-sprint-list">
              {plan.items.map((item) => (
                <li key={item.dayPlanItemId}>
                  {titleById.get(item.workItemId) ?? "Unknown item"} · {item.plannedMinutes}m
                </li>
              ))}
            </ul>
          </article>
        ))}
        {dayPlans.length === 0 ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No day plan draft yet. Generate one after selecting backlog items.</p>
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onPrevious}>
          Back
        </button>
        <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)", alignSelf: "center" }}>
          {freezeState ? "Sprint plan is frozen." : "Review and freeze when ready."}
        </span>
      </div>
    </section>
  );
}
