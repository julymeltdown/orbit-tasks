import { useMemo, useState } from "react";

export interface DSUSummary {
  blockerCount: number;
  statusSignal: "on_track" | "at_risk";
  asks: string[];
}

interface Props {
  onSubmit: (rawText: string) => Promise<DSUSummary>;
}

export function DSUComposerPanel({ onSubmit }: Props) {
  const [rawText, setRawText] = useState("");
  const [summary, setSummary] = useState<DSUSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progressLabel = useMemo(() => {
    if (!summary) return "No DSU submitted";
    return summary.statusSignal === "on_track"
      ? `On track · blockers ${summary.blockerCount}`
      : `At risk · blockers ${summary.blockerCount}`;
  }, [summary]);

  async function handleSubmit() {
    if (!rawText.trim()) {
      setError("DSU text is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const next = await onSubmit(rawText);
      setSummary(next);
      setRawText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit DSU");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>DSU Composer</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        Enter yesterday/today/blockers in one note. The service normalizes blocker signal for schedule health.
      </p>
      <textarea
        className="orbit-input"
        style={{ minHeight: 120, resize: "vertical" }}
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        placeholder="어제/오늘/블로커를 입력하세요."
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="orbit-button" type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit DSU"}
        </button>
        <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{progressLabel}</span>
      </div>
      {summary && summary.asks.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
          {summary.asks.map((ask) => (
            <li key={ask}>{ask}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </article>
  );
}
