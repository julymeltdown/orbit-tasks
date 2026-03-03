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
          stashIntent(`/dl/${token}`);
          navigate(`/login?returnTo=${encodeURIComponent(`/dl/${token}`)}`, { replace: true });
          return;
        }
        if (result.status === "OK") {
          navigate(result.targetPath, { replace: true });
          return;
        }
        setMessage(`Deep link unavailable: ${result.reason}`);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Failed to resolve deep link");
      });
  }, [navigate, token]);

  return (
    <div className="orbit-panel" style={{ maxWidth: 560, margin: "16vh auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Deep Link Resolver</h1>
      <p style={{ color: "var(--orbit-text-subtle)", marginBottom: 0 }}>{message}</p>
    </div>
  );
}
