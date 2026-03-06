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
        <div>
          <p className="orbit-notion-detail__label">의존성 점검</p>
          <h3 style={{ margin: 0 }}>선행/후행 작업 정리</h3>
        </div>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
          닫기
        </button>
      </header>
      {!selected ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>먼저 작업을 선택해야 의존성을 점검할 수 있습니다.</p>
      ) : (
        <>
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
            기준 작업: <strong>{displayWorkItemTitle(selected.title)}</strong>
          </p>
          <div className="orbit-dependency-inspector__groups">
            <section className="orbit-detail-section">
              <p className="orbit-ops-hub__eyebrow">선행 작업</p>
              <ul className="orbit-dependency-inspector__list">
                {upstream.map((item) => (
                  <li key={item.workItemId}>{displayWorkItemTitle(item.title)}</li>
                ))}
                {upstream.length === 0 ? <li style={{ color: "var(--orbit-text-subtle)" }}>등록된 선행 작업이 없습니다.</li> : null}
              </ul>
            </section>
            <section className="orbit-detail-section">
              <p className="orbit-ops-hub__eyebrow">후행 작업</p>
              <ul className="orbit-dependency-inspector__list">
                {downstream.map((item) => (
                  <li key={item.workItemId}>{displayWorkItemTitle(item.title)}</li>
                ))}
                {downstream.length === 0 ? <li style={{ color: "var(--orbit-text-subtle)" }}>등록된 후행 작업이 없습니다.</li> : null}
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
                {displayWorkItemTitle(candidate.title)} 연결
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
