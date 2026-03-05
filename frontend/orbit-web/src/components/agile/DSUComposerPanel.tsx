import { useMemo, useState } from "react";

export interface DSUSummary {
  dsuId?: string;
  blockerCount: number;
  statusSignal: "on_track" | "at_risk";
  asks: string[];
}

export interface DSUComposePayload {
  yesterday: string;
  today: string;
  blockers: string;
  asks: string;
  rawText: string;
}

interface Props {
  onSubmit: (payload: DSUComposePayload) => Promise<DSUSummary>;
}

export function DSUComposerPanel({ onSubmit }: Props) {
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [asks, setAsks] = useState("");
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
    if (!today.trim() && !blockers.trim() && !yesterday.trim()) {
      setError("Fill at least one DSU section");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const rawText = [
        `어제: ${yesterday || "-"}`,
        `오늘: ${today || "-"}`,
        `블로커: ${blockers || "-"}`,
        `도움요청: ${asks || "-"}`
      ].join("\n");
      const next = await onSubmit({
        yesterday,
        today,
        blockers,
        asks,
        rawText
      });
      setSummary(next);
      setYesterday("");
      setToday("");
      setBlockers("");
      setAsks("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit DSU");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="orbit-dsu-panel">
      <h3 style={{ margin: 0 }}>DSU Composer</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        Enter yesterday/today/blockers in one note. The service normalizes blocker signal for schedule health.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Yesterday
          <textarea
            className="orbit-input"
            style={{ minHeight: 68, resize: "vertical" }}
            value={yesterday}
            onChange={(event) => setYesterday(event.target.value)}
            placeholder="어제 완료한 작업"
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Today
          <textarea
            className="orbit-input"
            style={{ minHeight: 68, resize: "vertical" }}
            value={today}
            onChange={(event) => setToday(event.target.value)}
            placeholder="오늘 진행할 작업"
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Blockers
          <textarea
            className="orbit-input"
            style={{ minHeight: 68, resize: "vertical" }}
            value={blockers}
            onChange={(event) => setBlockers(event.target.value)}
            placeholder="막힌 이슈, 의존성, 승인 대기"
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Asks
          <textarea
            className="orbit-input"
            style={{ minHeight: 68, resize: "vertical" }}
            value={asks}
            onChange={(event) => setAsks(event.target.value)}
            placeholder="도움요청, 의사결정 요청"
          />
        </label>
      </div>
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
