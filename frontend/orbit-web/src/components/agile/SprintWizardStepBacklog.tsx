import { displayWorkItemTitle } from "@/features/workitems/display";
import type { WorkItem } from "@/features/workitems/types";
import type { BacklogItemView } from "@/features/agile/hooks/useSprintPlanning";

interface Props {
  workItems: WorkItem[];
  backlog: BacklogItemView[];
  loading: boolean;
  onAddBacklog: (workItemId: string) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
}

export function SprintWizardStepBacklog({ workItems, backlog, loading, onAddBacklog, onNext, onPrevious }: Props) {
  const backlogSet = new Set(backlog.filter((item) => item.status !== "REMOVED").map((item) => item.workItemId));
  const titleById = new Map(workItems.map((item) => [item.workItemId, displayWorkItemTitle(item.title)]));

  return (
    <section className="orbit-sprint-step">
      <div>
        <p className="orbit-ops-hub__eyebrow" style={{ marginBottom: 6 }}>Step 2</p>
        <h3 style={{ margin: 0 }}>이번 스프린트에 넣을 작업을 고르세요</h3>
        <p style={{ margin: "6px 0 0", color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          여기서 추가한 backlog만 day plan draft의 입력으로 사용됩니다. 너무 많이 넣으면 다음 단계에서 과밀 경고가 보입니다.
        </p>
      </div>

      <div className="orbit-sprint-scroll-list">
        {workItems
          .filter((item) => item.status !== "ARCHIVED")
          .map((item) => {
            const alreadyAdded = backlogSet.has(item.workItemId);
            return (
              <div
                key={item.workItemId}
                className="orbit-sprint-row orbit-animate-row"
              >
                <div className="orbit-sprint-row__meta">
                  <strong>{displayWorkItemTitle(item.title)}</strong>
                  <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                    {item.status} · {item.assignee || "unassigned"}
                  </span>
                </div>
                <button
                  className="orbit-button orbit-button--ghost"
                  type="button"
                  onClick={() => onAddBacklog(item.workItemId)}
                  disabled={loading || alreadyAdded}
                >
                  {alreadyAdded ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
      </div>

      <div className="orbit-sprint-summary">
        <strong style={{ fontSize: 12 }}>현재 Sprint Backlog ({backlog.length})</strong>
        {backlog.length === 0 ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>아직 선택된 backlog가 없습니다. 핵심 작업부터 넣으세요.</p>
        ) : (
          <ul className="orbit-sprint-list">
            {backlog.map((item) => (
              <li key={item.backlogItemId}>
                {titleById.get(item.workItemId) ?? "Unknown item"} · rank {item.rank} · {item.status}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onPrevious}>
          이전
        </button>
        <button className="orbit-button" type="button" onClick={onNext} disabled={loading}>
          day plan 만들기
        </button>
      </div>
    </section>
  );
}
