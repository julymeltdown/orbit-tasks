import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";
import { AuditEventExplorer } from "@/components/admin/AuditEventExplorer";
import { PolicyControlForms } from "@/components/admin/PolicyControlForms";
import { useEvidenceExport } from "@/features/admin/hooks/useEvidenceExport";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface AuditEvent {
  eventId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

interface RetentionRule {
  ruleId: string;
  workspaceId: string;
  dataset: string;
  retentionDays: number;
  hardDelete: boolean;
  updatedAt: string;
}

interface AiControl {
  policyId: string;
  workspaceId: string;
  requireStoreFalse: boolean;
  maskPii: boolean;
  maxTokensPerCall: number;
  enabled: boolean;
  updatedAt: string;
}

export function ComplianceDashboardPage() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const actor = useAuthStore((state) => state.userId) ?? "admin@orbit.local";
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [evidence, setEvidence] = useState("");
  const [retention, setRetention] = useState<RetentionRule | null>(null);
  const [aiControl, setAiControl] = useState<AiControl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { exportAuditJsonl } = useEvidenceExport(workspaceId ?? "");

  async function refreshEvents() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    try {
      const next = await request<AuditEvent[]>(
        `/api/admin/governance/audit-events?workspaceId=${encodeURIComponent(workspaceId)}`
      );
      setEvents(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit events");
    }
  }

  async function refreshPolicies() {
    if (!workspaceId) {
      return;
    }
    try {
      const [rules, controls] = await Promise.all([
        request<RetentionRule[]>(`/api/admin/governance/retention-rules?workspaceId=${encodeURIComponent(workspaceId)}`),
        request<AiControl[]>(`/api/admin/governance/ai-controls?workspaceId=${encodeURIComponent(workspaceId)}`)
      ]);
      setRetention(rules[0] ?? null);
      setAiControl(controls[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policy settings");
    }
  }

  async function saveRetention(input: { dataset: string; retentionDays: number; hardDelete: boolean }) {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    await request("/api/admin/governance/retention-rules", {
      method: "POST",
      body: {
        workspaceId,
        dataset: input.dataset,
        retentionDays: input.retentionDays,
        hardDelete: input.hardDelete,
        actor
      }
    });
    await refreshPolicies();
    await refreshEvents();
  }

  async function saveAIControl(input: {
    requireStoreFalse: boolean;
    maskPii: boolean;
    maxTokensPerCall: number;
    enabled: boolean;
  }) {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    await request("/api/admin/governance/ai-controls", {
      method: "POST",
      body: {
        workspaceId,
        ...input,
        actor
      }
    });
    await refreshPolicies();
    await refreshEvents();
  }

  async function exportEvidence() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    try {
      const payload = await exportAuditJsonl();
      setEvidence(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export evidence");
    }
  }

  useEffect(() => {
    refreshPolicies().catch(() => undefined);
    refreshEvents().catch(() => undefined);
  }, [workspaceId]);

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
        <PolicyControlForms
          onSaveRetention={saveRetention}
          onSaveAIControl={saveAIControl}
          initialRetention={retention ? { dataset: retention.dataset, retentionDays: retention.retentionDays, hardDelete: retention.hardDelete } : null}
          initialAiControl={
            aiControl
              ? {
                  requireStoreFalse: aiControl.requireStoreFalse,
                  maskPii: aiControl.maskPii,
                  maxTokensPerCall: aiControl.maxTokensPerCall,
                  enabled: aiControl.enabled
                }
              : null
          }
        />
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
