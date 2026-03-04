import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { DSUComposerPanel, DSUSummary } from "@/components/agile/DSUComposerPanel";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";

interface SprintView {
  sprintId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacitySp: number;
  status: string;
}

interface BacklogItemView {
  backlogItemId: string;
  workItemId: string;
  rank: number;
  status: string;
}

interface DsuView {
  dsuId: string;
  sprintId: string;
  authorId: string;
  rawText: string;
  blockerCount: number;
  statusSignal: "on_track" | "at_risk";
  createdAt: string;
}

export function SprintWorkspacePage() {
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const { items: workItems } = useWorkItems(projectId);

  const [sprint, setSprint] = useState<SprintView | null>(null);
  const [backlog, setBacklog] = useState<BacklogItemView[]>([]);
  const [dsuHistory, setDsuHistory] = useState<DsuView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sprintName, setSprintName] = useState("Sprint Orbit");
  const [goal, setGoal] = useState("결제 리팩토링 완료 및 릴리스 준비");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [capacitySp, setCapacitySp] = useState(18);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState("");
  const [rank, setRank] = useState(1);
  const [backlogStatus, setBacklogStatus] = useState("READY");

  const canCreateSprint = useMemo(() => {
    return Boolean(activeWorkspaceId && projectId && sprintName.trim() && goal.trim() && startDate && endDate);
  }, [activeWorkspaceId, projectId, sprintName, goal, startDate, endDate]);

  async function loadBacklogAndDsu(sprintId: string) {
    const [nextBacklog, nextDsu] = await Promise.all([
      request<BacklogItemView[]>(`/api/agile/sprints/${sprintId}/backlog`),
      request<DsuView[]>(`/api/agile/sprints/${sprintId}/dsu`)
    ]);
    setBacklog(nextBacklog);
    setDsuHistory(nextDsu);
  }

  async function createSprint() {
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
      const created = await request<SprintView>("/api/agile/sprints", {
        method: "POST",
        body: {
          workspaceId: activeWorkspaceId,
          projectId,
          name: sprintName.trim(),
          goal: goal.trim(),
          startDate,
          endDate,
          capacitySp
        }
      });
      setSprint(created);
      await loadBacklogAndDsu(created.sprintId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create sprint");
    } finally {
      setLoading(false);
    }
  }

  async function addBacklogItem() {
    if (!sprint) {
      setError("Create sprint first");
      return;
    }
    if (!selectedWorkItemId) {
      setError("Select a work item");
      return;
    }
    setError(null);
    try {
      await request(`/api/agile/sprints/${sprint.sprintId}/backlog`, {
        method: "POST",
        body: {
          workItemId: selectedWorkItemId,
          rank,
          status: backlogStatus
        }
      });
      await loadBacklogAndDsu(sprint.sprintId);
      setRank((prev) => prev + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add backlog item");
    }
  }

  async function submitDsu(rawText: string): Promise<DSUSummary> {
    if (!sprint) {
      throw new Error("Sprint not initialized");
    }
    const dsu = await request<{
      blockerCount: number;
      statusSignal: "on_track" | "at_risk";
    }>(`/api/agile/sprints/${sprint.sprintId}/dsu`, {
      method: "POST",
      body: {
        authorId: userId,
        rawText
      }
    });
    await loadBacklogAndDsu(sprint.sprintId);

    return {
      blockerCount: dsu.blockerCount,
      statusSignal: dsu.statusSignal,
      asks:
        dsu.statusSignal === "at_risk"
          ? ["인프라 승인 ETA 확인", "플랜B 배포 조건 확인"]
          : ["내일 목표 범위 확정"]
    };
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Sprint Workspace</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          스프린트 생성, 백로그 편성, DSU 루프를 한 화면에서 운영합니다.
        </p>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
          <input className="orbit-input" value={sprintName} onChange={(event) => setSprintName(event.target.value)} placeholder="Sprint name" />
          <input className="orbit-input" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Sprint goal" />
          <input className="orbit-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className="orbit-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <input
            className="orbit-input"
            type="number"
            min={1}
            value={capacitySp}
            onChange={(event) => setCapacitySp(Number(event.target.value))}
            placeholder="SP"
          />
          <button className="orbit-button" type="button" onClick={createSprint} disabled={loading || !canCreateSprint}>
            {loading ? "Creating..." : "Create Sprint"}
          </button>
        </div>

        {sprint ? (
          <div className="orbit-panel orbit-animate-card" style={{ padding: 12, marginTop: 10 }}>
            <strong>{sprint.name}</strong> · {sprint.startDate} ~ {sprint.endDate} · Capacity {sprint.capacitySp} SP
            <div style={{ color: "var(--orbit-text-subtle)", fontSize: 14, marginTop: 6 }}>{sprint.goal}</div>
          </div>
        ) : null}
      </article>

      <article className="orbit-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Backlog</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
          <select className="orbit-input" value={selectedWorkItemId} onChange={(event) => setSelectedWorkItemId(event.target.value)}>
            <option value="">Select work item...</option>
            {workItems
              .filter((item) => item.status !== "ARCHIVED")
              .map((item) => (
                <option key={item.workItemId} value={item.workItemId}>
                  {item.title}
                </option>
              ))}
          </select>
          <input className="orbit-input" type="number" min={1} value={rank} onChange={(event) => setRank(Number(event.target.value))} />
          <select className="orbit-input" value={backlogStatus} onChange={(event) => setBacklogStatus(event.target.value)}>
            <option value="READY">READY</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="REMOVED">REMOVED</option>
          </select>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={addBacklogItem} disabled={!sprint}>
            Add
          </button>
        </div>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
          {backlog.map((item) => (
            <li key={item.backlogItemId}>
              WorkItem {item.workItemId.slice(0, 8)} · Rank {item.rank} · {item.status}
            </li>
          ))}
          {backlog.length === 0 ? <li style={{ color: "var(--orbit-text-subtle)" }}>No backlog entries yet.</li> : null}
        </ul>
      </article>

      <div>
        <DSUComposerPanel onSubmit={submitDsu} />
        <article className="orbit-card" style={{ padding: 16, marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>DSU History</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {dsuHistory.map((entry) => (
              <div key={entry.dsuId} className="orbit-panel orbit-animate-card" style={{ padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{entry.authorId}</strong>
                  <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                    {new Date(entry.createdAt).toLocaleString()} · {entry.statusSignal}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{entry.rawText}</p>
              </div>
            ))}
            {dsuHistory.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No DSU submitted yet.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
