import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";

type HubModule = {
  id: string;
  title: string;
  description: string;
  path: string;
  primaryLabel: string;
  secondaryPath: string;
  secondaryLabel: string;
  metricLabel: string;
  metricValue: string;
};

export function OperationsHubPage() {
  const navigate = useNavigate();
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loadingClaims = useWorkspaceStore((state) => state.loading);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const { byStatus, items, loading: loadingItems } = useWorkItems(projectId);

  useEffect(() => {
    if (claims.length === 0 && !loadingClaims) {
      loadClaims().catch(() => undefined);
    }
  }, [claims.length, loadingClaims, loadClaims]);

  const activeWorkspace = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === activeWorkspaceId) ?? null;
  }, [claims, activeWorkspaceId]);

  const modules: HubModule[] = useMemo(() => {
    const activeCount = byStatus.IN_PROGRESS.length;
    const backlogCount = byStatus.TODO.length;
    const reviewCount = byStatus.REVIEW.length;
    const doneCount = byStatus.DONE.length;
    const inboxCount = Math.max(0, items.length - doneCount);

    return [
      {
        id: "kanban",
        title: "Kanban Board",
        description: "업무를 생성/이동/아카이브하며 진행 상태를 업데이트합니다.",
        path: "/app/projects/board",
        primaryLabel: "Open Board",
        secondaryPath: "/app/projects/table",
        secondaryLabel: "Open Table",
        metricLabel: "Backlog",
        metricValue: `${backlogCount}`
      },
      {
        id: "timeline",
        title: "Timeline",
        description: "같은 Work Item을 일정 축에서 보고 리스크를 조기에 확인합니다.",
        path: "/app/projects/timeline",
        primaryLabel: "Open Timeline",
        secondaryPath: "/app/sprint",
        secondaryLabel: "Open Sprint",
        metricLabel: "Active",
        metricValue: `${activeCount}`
      },
      {
        id: "sprint",
        title: "Sprint Workspace",
        description: "스프린트 생성, 백로그 편성, DSU 루프를 한 화면에서 운영합니다.",
        path: "/app/sprint",
        primaryLabel: "Open Sprint",
        secondaryPath: "/app/inbox",
        secondaryLabel: "Open Inbox",
        metricLabel: "Review",
        metricValue: `${reviewCount}`
      },
      {
        id: "inbox",
        title: "Collaboration Inbox",
        description: "멘션/스레드 알림을 모아보고 읽음 상태와 스레드 이동을 처리합니다.",
        path: "/app/inbox",
        primaryLabel: "Open Inbox",
        secondaryPath: "/app/team",
        secondaryLabel: "Open Team",
        metricLabel: "Signals",
        metricValue: `${inboxCount}`
      }
    ];
  }, [byStatus, items.length]);

  const projectToken = activeWorkspaceId ? projectId.slice(0, 8) : "not-selected";

  function ensureWorkspaceThenNavigate(path: string) {
    if (!activeWorkspaceId) {
      navigate(`/app/workspace/select?returnTo=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  }

  return (
    <section className="orbit-shell__content-grid orbit-ops-hub">
      <article className="orbit-card orbit-ops-hub__hero" style={{ gridColumn: "span 12" }}>
        <div className="orbit-ops-hub__hero-head">
          <div>
            <p className="orbit-ops-hub__eyebrow">Schedule Operations</p>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>기능이 연결된 작업 허브</h2>
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)", maxWidth: 760 }}>
              워크스페이스 컨텍스트를 유지한 채 보드·타임라인·테이블·스프린트·인박스로 바로 이동합니다.
              각 모듈은 같은 Work Item 집합을 공유하며 상태 변경이 즉시 반영됩니다.
            </p>
          </div>
          <div className="orbit-ops-hub__workspace">
            <strong>{activeWorkspace?.workspaceName ?? "No workspace selected"}</strong>
            <span>
              {activeWorkspace?.role ?? "WORKSPACE_MEMBER"} · Project {projectToken}
            </span>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/workspace/select")}>
              Change Workspace
            </button>
          </div>
        </div>

        <div className="orbit-ops-hub__flow">
          <button className="orbit-link-button" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/projects/board")}>
            1. Capture on Board
          </button>
          <button className="orbit-link-button" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/projects/timeline")}>
            2. Validate Timeline
          </button>
          <button className="orbit-link-button" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/projects/table")}>
            3. Bulk Update Table
          </button>
          <button className="orbit-link-button" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/sprint")}>
            4. Run Sprint
          </button>
          <button className="orbit-link-button" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/inbox")}>
            5. Resolve in Inbox
          </button>
        </div>
      </article>

      {modules.map((module) => (
        <article key={module.id} className="orbit-card orbit-ops-hub__module" style={{ gridColumn: "span 6" }}>
          <div className="orbit-ops-hub__module-head">
            <h3 style={{ margin: 0 }}>{module.title}</h3>
            <div className="orbit-ops-hub__metric">
              <span>{module.metricLabel}</span>
              <strong>{loadingItems ? "..." : module.metricValue}</strong>
            </div>
          </div>
          <p style={{ color: "var(--orbit-text-subtle)", margin: "0 0 14px" }}>{module.description}</p>
          <div className="orbit-ops-hub__actions">
            <button className="orbit-button" type="button" onClick={() => ensureWorkspaceThenNavigate(module.path)}>
              {module.primaryLabel}
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => ensureWorkspaceThenNavigate(module.secondaryPath)}>
              {module.secondaryLabel}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
