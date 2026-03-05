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
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Step 2 · Backlog Selection</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
        Choose work items for this sprint. Added items are used for day-plan draft generation.
      </p>

      <div style={{ display: "grid", gap: 8, maxHeight: "42vh", overflowY: "auto", paddingRight: 4 }}>
        {workItems
          .filter((item) => item.status !== "ARCHIVED")
          .map((item) => {
            const alreadyAdded = backlogSet.has(item.workItemId);
            return (
              <div
                key={item.workItemId}
                className="orbit-panel orbit-animate-row"
                style={{ padding: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}
              >
                <div style={{ display: "grid", gap: 4 }}>
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

      <div className="orbit-panel" style={{ padding: 10, display: "grid", gap: 6 }}>
        <strong style={{ fontSize: 12 }}>Current Sprint Backlog</strong>
        {backlog.length === 0 ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>No backlog items selected yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
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
          Back
        </button>
        <button className="orbit-button" type="button" onClick={onNext} disabled={loading}>
          Continue
        </button>
      </div>
    </article>
  );
}
