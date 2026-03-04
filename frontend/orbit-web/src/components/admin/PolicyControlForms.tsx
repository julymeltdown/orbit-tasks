import { useEffect, useState } from "react";

interface RetentionRuleInput {
  dataset: string;
  retentionDays: number;
  hardDelete: boolean;
}

interface AIControlInput {
  requireStoreFalse: boolean;
  maskPii: boolean;
  maxTokensPerCall: number;
  enabled: boolean;
}

interface Props {
  onSaveRetention: (input: RetentionRuleInput) => Promise<void>;
  onSaveAIControl: (input: AIControlInput) => Promise<void>;
  initialRetention?: RetentionRuleInput | null;
  initialAiControl?: AIControlInput | null;
  allowRetention?: boolean;
  allowAiControls?: boolean;
}

export function PolicyControlForms({
  onSaveRetention,
  onSaveAIControl,
  initialRetention = null,
  initialAiControl = null,
  allowRetention = true,
  allowAiControls = true
}: Props) {
  const [dataset, setDataset] = useState(initialRetention?.dataset ?? "dsu_entries");
  const [retentionDays, setRetentionDays] = useState(initialRetention?.retentionDays ?? 365);
  const [hardDelete, setHardDelete] = useState(initialRetention?.hardDelete ?? false);
  const [requireStoreFalse, setRequireStoreFalse] = useState(initialAiControl?.requireStoreFalse ?? true);
  const [maskPii, setMaskPii] = useState(initialAiControl?.maskPii ?? true);
  const [maxTokensPerCall, setMaxTokensPerCall] = useState(initialAiControl?.maxTokensPerCall ?? 4000);
  const [enabled, setEnabled] = useState(initialAiControl?.enabled ?? true);
  const [tab, setTab] = useState<"RETENTION" | "AI_CONTROLS">("RETENTION");

  useEffect(() => {
    if (!initialRetention) return;
    setDataset(initialRetention.dataset);
    setRetentionDays(initialRetention.retentionDays);
    setHardDelete(initialRetention.hardDelete);
  }, [initialRetention?.dataset, initialRetention?.retentionDays, initialRetention?.hardDelete]);

  useEffect(() => {
    if (!initialAiControl) return;
    setRequireStoreFalse(initialAiControl.requireStoreFalse);
    setMaskPii(initialAiControl.maskPii);
    setMaxTokensPerCall(initialAiControl.maxTokensPerCall);
    setEnabled(initialAiControl.enabled);
  }, [
    initialAiControl?.requireStoreFalse,
    initialAiControl?.maskPii,
    initialAiControl?.maxTokensPerCall,
    initialAiControl?.enabled
  ]);

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Policy Controls</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className={`orbit-link-button orbit-link-button--tab${tab === "RETENTION" ? " is-active" : ""}`}
          type="button"
          onClick={() => setTab("RETENTION")}
          disabled={!allowRetention}
        >
          Retention
        </button>
        <button
          className={`orbit-link-button orbit-link-button--tab${tab === "AI_CONTROLS" ? " is-active" : ""}`}
          type="button"
          onClick={() => setTab("AI_CONTROLS")}
          disabled={!allowAiControls}
        >
          AI Controls
        </button>
      </div>

      {tab === "RETENTION" ? (
      <section className="orbit-panel" style={{ padding: 12, display: "grid", gap: 8 }}>
        <strong>Retention Policy</strong>
        {!allowRetention ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
            You do not have permission to edit retention policy.
          </p>
        ) : null}
        <input className="orbit-input" value={dataset} onChange={(event) => setDataset(event.target.value)} />
        <input
          className="orbit-input"
          type="number"
          value={retentionDays}
          onChange={(event) => setRetentionDays(Number(event.target.value))}
        />
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={hardDelete} onChange={(event) => setHardDelete(event.target.checked)} /> Hard delete
        </label>
        <button
          className="orbit-button orbit-button--ghost"
          type="button"
          onClick={() => onSaveRetention({ dataset, retentionDays, hardDelete })}
          disabled={!allowRetention}
        >
          Save Retention
        </button>
      </section>
      ) : null}

      {tab === "AI_CONTROLS" ? (
      <section className="orbit-panel" style={{ padding: 12, display: "grid", gap: 8 }}>
        <strong>AI Control</strong>
        {!allowAiControls ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
            You do not have permission to edit AI controls.
          </p>
        ) : null}
        <label style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={requireStoreFalse}
            onChange={(event) => setRequireStoreFalse(event.target.checked)}
          />
          Require store:false
        </label>
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={maskPii} onChange={(event) => setMaskPii(event.target.checked)} />
          Mask PII
        </label>
        <input
          className="orbit-input"
          type="number"
          value={maxTokensPerCall}
          onChange={(event) => setMaxTokensPerCall(Number(event.target.value))}
        />
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Enabled
        </label>
        <button
          className="orbit-button orbit-button--ghost"
          type="button"
          onClick={() => onSaveAIControl({ requireStoreFalse, maskPii, maxTokensPerCall, enabled })}
          disabled={!allowAiControls}
        >
          Save AI Controls
        </button>
      </section>
      ) : null}
    </article>
  );
}
