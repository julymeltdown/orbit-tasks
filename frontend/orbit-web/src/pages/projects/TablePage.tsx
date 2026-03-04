import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItemStatus, WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";

const STATUS_OPTIONS: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "ARCHIVED"];

export function TablePage() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const { items, loading, error, mutation, createItem, updateStatus, archiveItem } = useWorkItems(projectId);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [type, setType] = useState<WorkItemType>("TASK");
  const [statusFilter, setStatusFilter] = useState<WorkItemStatus | "ALL">("ALL");
  const [localError, setLocalError] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (statusFilter === "ALL") {
      return items;
    }
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  async function onCreate() {
    if (!title.trim()) {
      setLocalError("Title is required");
      return;
    }
    setLocalError(null);
    try {
      await createItem({
        projectId,
        type,
        title: title.trim(),
        assignee: assignee.trim() || undefined
      });
      setTitle("");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Table View</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>대량 편집/필터링/상태 변경/아카이브를 테이블에서 처리합니다.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <input className="orbit-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New work item title" />
          <input className="orbit-input" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Assignee" />
          <select className="orbit-input" value={type} onChange={(event) => setType(event.target.value as WorkItemType)}>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
            <option value="BUG">Bug</option>
            <option value="EPIC">Epic</option>
          </select>
          <button className="orbit-button" type="button" onClick={onCreate}>
            Create
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <select className="orbit-input" style={{ maxWidth: 220 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as WorkItemStatus | "ALL")}>
            <option value="ALL">All status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? <p>Loading work items...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {localError ? <p style={{ color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </article>

      <article className="orbit-card" style={{ padding: 16 }}>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Title</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Type</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Assignee</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Due</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.workItemId} className="orbit-animate-row" style={{ borderBottom: "1px solid var(--orbit-border)" }}>
                  <td style={{ padding: "10px 0" }}>{item.title}</td>
                  <td>{item.type}</td>
                  <td>
                    <select
                      className="orbit-input"
                      style={{ width: 170, minWidth: 170 }}
                      value={item.status}
                      onChange={(event) => updateStatus(item.workItemId, event.target.value as WorkItemStatus)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{item.assignee || "-"}</td>
                  <td>{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "-"}</td>
                  <td>
                    {item.status !== "ARCHIVED" ? (
                      <button className="orbit-button orbit-button--ghost" type="button" onClick={() => archiveItem(item.workItemId)}>
                        Archive
                      </button>
                    ) : (
                      <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>Archived</span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ paddingTop: 14, color: "var(--orbit-text-subtle)" }}>
                    No work items for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
