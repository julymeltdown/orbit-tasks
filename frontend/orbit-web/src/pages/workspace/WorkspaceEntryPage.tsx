import { useEffect, useState } from "react";
import { HttpError, request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";

interface WorkspaceClaim {
  workspaceId: string;
  workspaceName: string;
  role: string;
  defaultWorkspace: boolean;
}

export function WorkspaceEntryPage() {
  const userId = useAuthStore((state) => state.userId);
  const [claims, setClaims] = useState<WorkspaceClaim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setError("Missing user session");
      setIsLoading(false);
      return;
    }

    request<WorkspaceClaim[]>(`/auth/workspace-claims?userId=${encodeURIComponent(userId)}`)
      .then((data) => {
        setClaims(data);
        setFallbackNotice(null);
      })
      .catch((e) => {
        if (e instanceof HttpError && e.status === 503) {
          setClaims([
            {
              workspaceId: userId,
              workspaceName: "Default Workspace",
              role: "WORKSPACE_MEMBER",
              defaultWorkspace: true
            }
          ]);
          setFallbackNotice("Identity claims service is temporarily unavailable. Showing default workspace.");
          setError(null);
          return;
        }
        setError(e instanceof Error ? e.message : "Cannot load workspace claims");
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Select a workspace</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Workspace scope and role come from identity-access service claims.
        </p>

        {isLoading && <p style={{ color: "var(--orbit-text-subtle)" }}>Loading workspace claims...</p>}
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

        {!isLoading && !error && (
          <div style={{ display: "grid", gap: 10 }}>
            {claims.map((claim) => (
              <div
                key={claim.workspaceId}
                className="orbit-panel"
                style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <strong>{claim.workspaceName}</strong>
                  <p style={{ margin: "6px 0 0", color: "var(--orbit-text-subtle)" }}>{claim.workspaceId}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{claim.role}</div>
                  {claim.defaultWorkspace && (
                    <div style={{ fontSize: 11, color: "var(--orbit-accent)", textTransform: "uppercase" }}>
                      Default
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
