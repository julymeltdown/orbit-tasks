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
      <div>
        <p className="orbit-ops-hub__eyebrow" style={{ marginBottom: 6 }}>Step 3</p>
        <h3 style={{ margin: 0 }}>AI Day Plan Draft를 검토하고 Freeze 하세요</h3>
        <p style={{ margin: "6px 0 0", color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          Freeze 전까지는 계획 초안입니다. Freeze 후부터 DSU Review가 열리고, 계획 기준으로 실제 진척을 비교할 수 있습니다.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onGenerate} disabled={loading || freezeState}>
          {loading ? "생성 중..." : "AI Draft 다시 생성"}
        </button>
        <button className="orbit-button" type="button" onClick={onFreeze} disabled={loading || freezeState || dayPlans.length === 0}>
          {freezeState ? "계획 확정됨" : "Sprint Plan Freeze"}
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
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>아직 draft가 없습니다. backlog를 선택한 뒤 AI draft를 생성하세요.</p>
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onPrevious}>
          이전
        </button>
        <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)", alignSelf: "center" }}>
          {freezeState ? "계획이 확정되었습니다. 이제 DSU Review로 이동하세요." : "분량과 버퍼를 검토한 뒤 freeze 하세요."}
        </span>
      </div>
    </section>
  );
}
