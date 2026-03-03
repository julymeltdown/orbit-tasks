import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";
import { DSUComposerPanel, DSUSummary } from "@/components/agile/DSUComposerPanel";

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

export function SprintWorkspacePage() {
  const [sprint, setSprint] = useState<SprintView | null>(null);
  const [backlog, setBacklog] = useState<BacklogItemView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<SprintView>("/api/agile/sprints", {
      method: "POST",
      body: {
        workspaceId: "11111111-1111-1111-1111-111111111111",
        projectId: "22222222-2222-2222-2222-222222222222",
        name: "Sprint Orbit-09",
        goal: "결제 리팩토링 완료 및 릴리스 준비",
        startDate: "2026-03-03",
        endDate: "2026-03-14",
        capacitySp: 18
      }
    })
      .then(async (created) => {
        setSprint(created);
        await request(`/api/agile/sprints/${created.sprintId}/backlog`, {
          method: "POST",
          body: {
            workItemId: "33333333-3333-3333-3333-333333333333",
            rank: 1,
            status: "READY"
          }
        });
        return request<BacklogItemView[]>(`/api/agile/sprints/${created.sprintId}/backlog`);
      })
      .then((items) => setBacklog(items))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to bootstrap sprint"));
  }, []);

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
        authorId: "member@orbit.local",
        rawText
      }
    });

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
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Sprint Workspace</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Sprint goal, backlog, and DSU loop are unified for daily operating rhythm.
        </p>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        {sprint ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <strong>{sprint.name}</strong> · {sprint.startDate} ~ {sprint.endDate} · Capacity {sprint.capacitySp} SP
            </div>
            <div style={{ color: "var(--orbit-text-subtle)", fontSize: 14 }}>{sprint.goal}</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {backlog.map((item) => (
                <li key={item.backlogItemId}>
                  WorkItem {item.workItemId.slice(0, 8)} · Rank {item.rank} · {item.status}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Preparing sprint context...</p>
        )}
      </article>
      <div style={{ gridColumn: "span 12" }}>
        <DSUComposerPanel onSubmit={submitDsu} />
      </div>
    </section>
  );
}
