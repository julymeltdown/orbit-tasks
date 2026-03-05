import type { WorkItem } from "@/features/workitems/hooks/useWorkItems";
import { displayWorkItemTitle } from "@/features/workitems/display";

interface DependencyEdge {
  dependencyId: string;
  fromWorkItemId: string;
  toWorkItemId: string;
  type: string;
}

interface Props {
  open: boolean;
  selectedWorkItemId: string | null;
  items: WorkItem[];
  edges: DependencyEdge[];
  onClose: () => void;
  onAddDependency: (fromWorkItemId: string, toWorkItemId: string) => Promise<void>;
}

export function DependencyInspectorPanel({
  open,
  selectedWorkItemId,
  items,
  edges,
  onClose,
  onAddDependency
}: Props) {
  if (!open) {
    return null;
  }

  const selected = items.find((item) => item.workItemId === selectedWorkItemId) ?? null;
  const upstream = edges
    .filter((edge) => edge.toWorkItemId === selectedWorkItemId)
    .map((edge) => items.find((item) => item.workItemId === edge.fromWorkItemId))
    .filter(Boolean) as WorkItem[];
  const downstream = edges
    .filter((edge) => edge.fromWorkItemId === selectedWorkItemId)
    .map((edge) => items.find((item) => item.workItemId === edge.toWorkItemId))
    .filter(Boolean) as WorkItem[];

  const candidates = items.filter((item) => item.workItemId !== selectedWorkItemId);

  return (
    <aside className="orbit-card orbit-dependency-inspector">
      <header className="orbit-dependency-inspector__head">
        <h3 style={{ margin: 0 }}>Dependency Inspector</h3>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
          Close
        </button>
      </header>
      {!selected ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>Select a work item to inspect dependencies.</p>
      ) : (
        <>
          <strong>{displayWorkItemTitle(selected.title)}</strong>
          <div className="orbit-dependency-inspector__groups">
            <section className="orbit-panel" style={{ padding: 10 }}>
              <p className="orbit-ops-hub__eyebrow">Upstream</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {upstream.map((item) => (
                  <li key={item.workItemId}>{displayWorkItemTitle(item.title)}</li>
                ))}
                {upstream.length === 0 ? <li style={{ color: "var(--orbit-text-subtle)" }}>No upstream dependencies</li> : null}
              </ul>
            </section>
            <section className="orbit-panel" style={{ padding: 10 }}>
              <p className="orbit-ops-hub__eyebrow">Downstream</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {downstream.map((item) => (
                  <li key={item.workItemId}>{displayWorkItemTitle(item.title)}</li>
                ))}
                {downstream.length === 0 ? <li style={{ color: "var(--orbit-text-subtle)" }}>No downstream dependencies</li> : null}
              </ul>
            </section>
          </div>
          <div className="orbit-dependency-inspector__actions">
            {candidates.slice(0, 6).map((candidate) => (
              <button
                key={candidate.workItemId}
                className="orbit-button orbit-button--ghost"
                type="button"
                onClick={() => onAddDependency(selected.workItemId, candidate.workItemId)}
              >
                Depends on: {displayWorkItemTitle(candidate.title)}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
