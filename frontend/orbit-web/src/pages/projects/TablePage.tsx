import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItemStatus, WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { displayWorkItemTitle } from "@/features/workitems/display";

const STATUS_OPTIONS: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "ARCHIVED"];

export function TablePage() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const viewContext = useProjectViewStore((state) => state.getContext(projectId));
  const setView = useProjectViewStore((state) => state.setView);
  const setFilter = useProjectViewStore((state) => state.setFilter);
  const { items, loading, error, mutation, createItem, updateStatus, updateItem, archiveItem } = useWorkItems(projectId);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [type, setType] = useState<WorkItemType>("TASK");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setView(projectId, "table");
  }, [projectId, setView]);

  const visible = useMemo(() => {
    const query = viewContext.filters.query.trim().toLowerCase();
    const assigneeFilter = viewContext.filters.assignee.trim().toLowerCase();
    return items.filter((item) => {
      if (viewContext.filters.status !== "ALL" && item.status !== viewContext.filters.status) {
        return false;
      }
      if (query && !item.title.toLowerCase().includes(query)) {
        return false;
      }
      if (assigneeFilter && !(item.assignee ?? "").toLowerCase().includes(assigneeFilter)) {
        return false;
      }
      return true;
    });
  }, [items, viewContext.filters.assignee, viewContext.filters.query, viewContext.filters.status]);

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
    <section className="orbit-table-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="Table View" subtitle="Bulk editing and audit-friendly operations over shared project data." />
      <section className="orbit-table-operations">
        <h2 style={{ marginTop: 0 }}>Table Operations</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: 8 }}>
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
          <select
            className="orbit-input"
            style={{ maxWidth: "14rem" }}
            value={viewContext.filters.status}
            onChange={(event) => setFilter(projectId, "status", event.target.value as WorkItemStatus | "ALL")}
          >
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
      </section>

      <section className="orbit-table-surface">
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: "max(100%, 54rem)", borderCollapse: "collapse", fontSize: 13 }}>
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
                  <td style={{ padding: "10px 0" }}>
                    <input
                      className="orbit-input"
                      value={displayWorkItemTitle(item.title)}
                      onChange={(event) => {
                        const nextTitle = event.target.value;
                        updateItem(item.workItemId, { title: nextTitle }).catch(() => undefined);
                      }}
                    />
                  </td>
                  <td>
                    <select
                      className="orbit-input"
                      value={item.type}
                      onChange={(event) => updateItem(item.workItemId, { type: event.target.value as WorkItemType })}
                    >
                      <option value="TASK">Task</option>
                      <option value="STORY">Story</option>
                      <option value="BUG">Bug</option>
                      <option value="EPIC">Epic</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="orbit-input"
                      style={{ width: "10.5rem", minWidth: "10.5rem" }}
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
                  <td>
                    <input
                      className="orbit-input"
                      value={item.assignee ?? ""}
                      placeholder="Assignee"
                      onChange={(event) => {
                        const next = event.target.value.trim();
                        updateItem(item.workItemId, { assignee: next.length > 0 ? next : null }).catch(() => undefined);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="orbit-input"
                      type="date"
                      value={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : ""}
                      onChange={(event) => updateItem(item.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
                    />
                  </td>
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
      </section>
    </section>
  );
}
