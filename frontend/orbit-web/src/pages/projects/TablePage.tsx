import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItemStatus, WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { displayWorkItemTitle } from "@/features/workitems/display";
import { type DrilldownMetric, getDrilldownLabel, matchesDrilldownMetric, resetFiltersForDrilldown } from "@/features/insights/drilldownContracts";

const STATUS_OPTIONS: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "ARCHIVED"];

export function TablePage() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const viewContext = useProjectViewStore((state) => state.getContext(projectId));
  const setView = useProjectViewStore((state) => state.setView);
  const setFilter = useProjectViewStore((state) => state.setFilter);
  const setLastDrilldownMetric = useProjectViewStore((state) => state.setLastDrilldownMetric);
  const { items, loading, error, mutation, createItem, updateStatus, updateItem, archiveItem } = useWorkItems(projectId);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [type, setType] = useState<WorkItemType>("TASK");
  const [localError, setLocalError] = useState<string | null>(null);
  const drilldownMetric = viewContext.lastDrilldownMetric as DrilldownMetric | null;

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
      return matchesDrilldownMetric(drilldownMetric, item);
    });
  }, [drilldownMetric, items, viewContext.filters.assignee, viewContext.filters.query, viewContext.filters.status]);

  const blockedCount = useMemo(
    () => visible.filter((item) => item.status !== "DONE" && item.status !== "ARCHIVED" && Boolean(item.blockedReason?.trim())).length,
    [visible]
  );
  const overdueCount = useMemo(() => {
    const now = Date.now();
    return visible.filter((item) => item.dueAt && item.status !== "DONE" && new Date(item.dueAt).getTime() < now).length;
  }, [visible]);

  async function onCreate() {
    if (!title.trim()) {
      setLocalError("제목을 입력하세요.");
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
      setLocalError(e instanceof Error ? e.message : "작업을 만들지 못했습니다.");
    }
  }

  return (
    <section className="orbit-table-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="작업 테이블" subtitle="여러 작업을 한눈에 비교하고 상태, 담당자, 기한을 빠르게 정리합니다." />

      <section className="orbit-board-focus-strip">
        <article className="orbit-board-focus-strip__metric">
          <strong>가시 작업</strong>
          <span>{visible.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>차단</strong>
          <span>{blockedCount}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>기한 초과</strong>
          <span>{overdueCount}개</span>
        </article>
      </section>

      {drilldownMetric ? (
        <section className="orbit-sprint-inline-note">
          <strong>현재 drilldown</strong>
          <p style={{ margin: 0 }}>{getDrilldownLabel(drilldownMetric)}</p>
          <div>
            <button
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => {
                const reset = resetFiltersForDrilldown();
                setFilter(projectId, "status", reset.status ?? "ALL");
                setFilter(projectId, "query", reset.query ?? "");
                setLastDrilldownMetric(projectId, null);
              }}
            >
              drilldown 해제
            </button>
          </div>
        </section>
      ) : null}

      <section className="orbit-table-operations">
        <h2 style={{ marginTop: 0 }}>빠른 추가와 일괄 검토</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: 8 }}>
          <input className="orbit-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="새 작업 제목" />
          <input className="orbit-input" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="담당자" />
          <select className="orbit-input" value={type} onChange={(event) => setType(event.target.value as WorkItemType)}>
            <option value="TASK">작업</option>
            <option value="STORY">스토리</option>
            <option value="BUG">버그</option>
            <option value="EPIC">에픽</option>
          </select>
          <button className="orbit-button" type="button" onClick={onCreate}>
            작업 추가
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            className="orbit-input"
            style={{ maxWidth: "14rem" }}
            value={viewContext.filters.status}
            onChange={(event) => setFilter(projectId, "status", event.target.value as WorkItemStatus | "ALL")}
          >
            <option value="ALL">전체 상태</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? <p>작업을 불러오는 중...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {localError ? <p style={{ color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </section>

      <section className="orbit-table-surface">
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: "max(100%, 54rem)", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>제목</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>유형</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>상태</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>담당자</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>기한</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--orbit-border)", paddingBottom: 8 }}>동작</th>
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
                      onChange={(event) => updateItem(item.workItemId, { type: event.target.value as WorkItemType }).catch(() => undefined)}
                    >
                      <option value="TASK">작업</option>
                      <option value="STORY">스토리</option>
                      <option value="BUG">버그</option>
                      <option value="EPIC">에픽</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="orbit-input"
                      style={{ width: "10.5rem", minWidth: "10.5rem" }}
                      value={item.status}
                      onChange={(event) => updateStatus(item.workItemId, event.target.value as WorkItemStatus).catch(() => undefined)}
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
                      placeholder="담당자"
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
                      <button className="orbit-button orbit-button--ghost" type="button" onClick={() => archiveItem(item.workItemId).catch(() => undefined)}>
                        보관
                      </button>
                    ) : (
                      <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>보관됨</span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ paddingTop: 14, color: "var(--orbit-text-subtle)" }}>
                    현재 필터에 맞는 작업이 없습니다.
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
