import { useState } from "react";
import { request } from "@/lib/http/client";
import { MigrationValidationReport } from "@/components/integrations/MigrationValidationReport";
import { IntegrationHealthPanel } from "@/components/integrations/IntegrationHealthPanel";

interface PreviewResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface JobResult {
  jobId: string;
  status: string;
}

export function ImportWizardPage() {
  const [sourceSystem, setSourceSystem] = useState("trello");
  const [sourceRef, setSourceRef] = useState("workspace://sample-board");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPreview() {
    try {
      const result = await request<PreviewResult>("/api/integrations/imports/preview", {
        method: "POST",
        body: {
          workspaceId: "11111111-1111-1111-1111-111111111111",
          sourceSystem,
          sourceRef,
          mapping: {
            todo: "TODO",
            doing: "IN_PROGRESS",
            done: "DONE"
          },
          includeComments: true,
          includeAttachments: false
        }
      });
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  async function runImport() {
    try {
      const result = await request<JobResult>("/api/integrations/imports/execute", {
        method: "POST",
        body: {
          workspaceId: "11111111-1111-1111-1111-111111111111",
          sourceSystem,
          sourceRef,
          mapping: {
            todo: "TODO",
            doing: "IN_PROGRESS",
            done: "DONE"
          },
          actor: "admin@orbit.local"
        }
      });
      setJob(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import execution failed");
    }
  }

  async function rollbackImport() {
    if (!job) return;
    try {
      const rolledBack = await request<JobResult>(`/api/integrations/imports/${job.jobId}/rollback`, {
        method: "POST",
        body: {}
      });
      setJob(rolledBack);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rollback failed");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Import Wizard</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Guided migration with preview validation, execution, and rollback snapshot.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="orbit-input" value={sourceSystem} onChange={(event) => setSourceSystem(event.target.value)} />
          <input className="orbit-input" value={sourceRef} onChange={(event) => setSourceRef(event.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="orbit-button" type="button" onClick={runPreview}>
            Preview
          </button>
          <button className="orbit-button" type="button" onClick={runImport}>
            Execute
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={rollbackImport}>
            Rollback
          </button>
        </div>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      <div style={{ gridColumn: "span 6" }}>
        <MigrationValidationReport valid={preview?.valid ?? false} errors={preview?.errors ?? []} warnings={preview?.warnings ?? []} />
      </div>

      <div style={{ gridColumn: "span 6" }}>
        <IntegrationHealthPanel
          connectors={[
            { provider: "Slack", status: "healthy", lastSyncAt: "2026-03-03T10:00:00Z", retryQueued: 0 },
            { provider: "Google Calendar", status: "degraded", lastSyncAt: "2026-03-03T09:56:00Z", retryQueued: 3 }
          ]}
        />
      </div>

      {job ? (
        <article className="orbit-card" style={{ gridColumn: "span 12", padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Import Job</h3>
          <div>
            Job {job.jobId} · Status <strong>{job.status}</strong>
          </div>
        </article>
      ) : null}
    </section>
  );
}
