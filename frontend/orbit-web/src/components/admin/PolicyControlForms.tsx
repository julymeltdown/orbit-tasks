import { useState } from "react";

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
}

export function PolicyControlForms({ onSaveRetention, onSaveAIControl }: Props) {
  const [dataset, setDataset] = useState("dsu_entries");
  const [retentionDays, setRetentionDays] = useState(365);
  const [hardDelete, setHardDelete] = useState(false);
  const [requireStoreFalse, setRequireStoreFalse] = useState(true);
  const [maskPii, setMaskPii] = useState(true);
  const [maxTokensPerCall, setMaxTokensPerCall] = useState(4000);
  const [enabled, setEnabled] = useState(true);

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Policy Controls</h3>

      <section className="orbit-panel" style={{ padding: 12, display: "grid", gap: 8 }}>
        <strong>Retention Policy</strong>
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
        >
          Save Retention
        </button>
      </section>

      <section className="orbit-panel" style={{ padding: 12, display: "grid", gap: 8 }}>
        <strong>AI Control</strong>
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
        >
          Save AI Controls
        </button>
      </section>
    </article>
  );
}
