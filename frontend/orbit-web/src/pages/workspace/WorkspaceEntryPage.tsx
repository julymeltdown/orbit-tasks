import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function WorkspaceEntryPage() {
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

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Select a workspace</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          워크스페이스 범위와 역할은 identity-access claim에서 동기화됩니다.
        </p>

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

        {!loading && !error && (
          <div style={{ display: "grid", gap: 10 }}>
            {claims.map((claim) => (
              <div
                key={claim.workspaceId}
                className="orbit-panel orbit-animate-card"
                style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <strong>{claim.workspaceName}</strong>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                    {claim.workspaceId.slice(0, 8)}...
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{claim.role}</div>
                  {claim.defaultWorkspace && (
                    <div style={{ fontSize: 11, color: "var(--orbit-accent)", textTransform: "uppercase" }}>
                      Default
                    </div>
                  )}
                  <button
                    className={`orbit-button ${activeWorkspaceId === claim.workspaceId ? "orbit-button--ghost" : ""}`}
                    type="button"
                    style={{ marginTop: 8 }}
                    onClick={() => setActiveWorkspace(claim.workspaceId)}
                    disabled={activeWorkspaceId === claim.workspaceId}
                  >
                    {activeWorkspaceId === claim.workspaceId ? "Selected" : "Use Workspace"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
