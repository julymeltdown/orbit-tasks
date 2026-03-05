import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { resolveReturnTo } from "@/lib/routing/restoreIntent";

export function WorkspaceEntryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedPath = resolveReturnTo(params.get("returnTo"), "/app/projects/board");
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loading = useWorkspaceStore((state) => state.loading);
  const error = useWorkspaceStore((state) => state.error);
  const fallbackNotice = useWorkspaceStore((state) => state.fallbackNotice);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);

  useEffect(() => {
    loadClaims().catch(() => undefined);
  }, [loadClaims]);

  function useWorkspaceAndNavigate(workspaceId: string, path: string) {
    setActiveWorkspace(workspaceId);
    navigate(path);
  }

  function openWithCurrentWorkspace(path: string) {
    const targetWorkspaceId = activeWorkspaceId ?? claims[0]?.workspaceId;
    if (!targetWorkspaceId) {
      navigate(path);
      return;
    }
    useWorkspaceAndNavigate(targetWorkspaceId, path);
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Select a workspace</h2>

        {loading && <p style={{ color: "var(--orbit-text-subtle)" }}>Loading workspace claims...</p>}
        {error && (
          <p role="alert" style={{ color: "var(--orbit-danger)" }}>
            {error}
          </p>
        )}
        {fallbackNotice && (
          <p role="status" style={{ color: "var(--orbit-text-subtle)" }}>
            {fallbackNotice}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/board")}>
            Open Kanban
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/timeline")}>
            Open Timeline
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/table")}>
            Open Table
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/sprint")}>
            Open Sprint
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/inbox")}>
            Open Inbox
          </button>
          {params.get("returnTo") ? (
            <button className="orbit-button" type="button" onClick={() => openWithCurrentWorkspace(requestedPath)}>
              Continue Requested Page
            </button>
          ) : null}
        </div>

        {!loading && !error && (
          <div style={{ display: "grid", gap: 10 }}>
            {claims.map((claim) => (
              <div
                key={claim.workspaceId}
                className="orbit-panel orbit-animate-card"
                style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                <div>
                  <strong>{claim.workspaceName}</strong>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--orbit-text-subtle)" }}>Workspace scope ready</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: "auto" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{claim.role}</div>
                  {claim.defaultWorkspace && (
                    <div style={{ fontSize: 11, color: "var(--orbit-accent)", textTransform: "uppercase" }}>
                      Default
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      className={`orbit-button ${activeWorkspaceId === claim.workspaceId ? "orbit-button--ghost" : ""}`}
                      type="button"
                      onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/board")}
                    >
                      {activeWorkspaceId === claim.workspaceId ? "Open Board" : "Use & Open"}
                    </button>
                    <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/timeline")}>
                      Timeline
                    </button>
                    <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/table")}>
                      Table
                    </button>
                    <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/sprint")}>
                      Sprint
                    </button>
                    {activeWorkspaceId === claim.workspaceId ? (
                      <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/inbox")}>
                        Open Inbox
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
