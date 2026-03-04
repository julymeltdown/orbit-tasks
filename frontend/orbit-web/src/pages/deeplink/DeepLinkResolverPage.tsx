import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "@/lib/http/client";
import { stashIntent } from "@/lib/routing/restoreIntent";

interface ResolveResponse {
  status: "OK" | "AUTH_REQUIRED" | "EXPIRED" | "NOT_FOUND";
  targetPath: string;
  reason: string;
}

export function DeepLinkResolverPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [message, setMessage] = useState("Resolving deep link...");

  useEffect(() => {
    if (!token) {
      setMessage("Invalid deep link token");
      return;
    }

    request<ResolveResponse>(`/api/deeplinks/${token}/resolve`)
      .then((result) => {
        if (result.status === "AUTH_REQUIRED") {
          const returnTo = `/dl/${token}`;
          stashIntent(returnTo);
          navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
          return;
        }
        if (result.status === "OK") {
          navigate(result.targetPath, { replace: true });
          return;
        }
        setMessage(`Deep link unavailable: ${result.reason}. Redirecting to inbox...`);
        window.setTimeout(() => navigate("/app/inbox", { replace: true }), 1200);
      })
      .catch((error) => {
        const reason = error instanceof Error ? error.message : "Failed to resolve deep link";
        setMessage(`${reason}. Redirecting to inbox...`);
        window.setTimeout(() => navigate("/app/inbox", { replace: true }), 1200);
      });
  }, [navigate, token]);

  return (
    <div className="orbit-panel" style={{ maxWidth: 560, margin: "16vh auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Deep Link Resolver</h1>
      <p style={{ color: "var(--orbit-text-subtle)", marginBottom: 0 }}>{message}</p>
    </div>
  );
}
