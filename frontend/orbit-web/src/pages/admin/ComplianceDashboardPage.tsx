import { useState } from "react";
import { request } from "@/lib/http/client";
import { AuditEventExplorer } from "@/components/admin/AuditEventExplorer";
import { PolicyControlForms } from "@/components/admin/PolicyControlForms";
import { useEvidenceExport } from "@/features/admin/hooks/useEvidenceExport";

interface AuditEvent {
  eventId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

const WORKSPACE_ID = "11111111-1111-1111-1111-111111111111";

export function ComplianceDashboardPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { exportAuditJsonl } = useEvidenceExport(WORKSPACE_ID);

  async function refreshEvents() {
    try {
      const next = await request<AuditEvent[]>(
        `/api/admin/governance/audit-events?workspaceId=${encodeURIComponent(WORKSPACE_ID)}`
      );
      setEvents(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit events");
    }
  }

  async function saveRetention(input: { dataset: string; retentionDays: number; hardDelete: boolean }) {
    await request("/api/admin/governance/retention-rules", {
      method: "POST",
      body: {
        workspaceId: WORKSPACE_ID,
        dataset: input.dataset,
        retentionDays: input.retentionDays,
        hardDelete: input.hardDelete,
        actor: "admin@orbit.local"
      }
    });
    await refreshEvents();
  }

  async function saveAIControl(input: {
    requireStoreFalse: boolean;
    maskPii: boolean;
    maxTokensPerCall: number;
    enabled: boolean;
  }) {
    await request("/api/admin/governance/ai-controls", {
      method: "POST",
      body: {
        workspaceId: WORKSPACE_ID,
        ...input,
        actor: "admin@orbit.local"
      }
    });
    await refreshEvents();
  }

  async function exportEvidence() {
    try {
      const payload = await exportAuditJsonl();
      setEvidence(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export evidence");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Compliance Dashboard</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Audit events, retention controls, and AI transmission policies for enterprise governance.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="orbit-button" type="button" onClick={refreshEvents}>
            Refresh Audit Events
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={exportEvidence}>
            Export Evidence
          </button>
        </div>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      <div style={{ gridColumn: "span 7" }}>
        <AuditEventExplorer events={events} />
      </div>
      <div style={{ gridColumn: "span 5" }}>
        <PolicyControlForms onSaveRetention={saveRetention} onSaveAIControl={saveAIControl} />
      </div>

      {evidence ? (
        <article className="orbit-card" style={{ gridColumn: "span 12", padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Evidence Export (JSONL)</h3>
          <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>{evidence}</pre>
        </article>
      ) : null}
    </section>
  );
}
