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
  disabled?: boolean;
  disabledReason?: string;
}

export function DSUComposerPanel({ onSubmit, disabled = false, disabledReason }: Props) {
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
    if (disabled) {
      setError(disabledReason ?? "DSU is currently locked");
      return;
    }
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
    <article className="orbit-dsu-panel" aria-disabled={disabled}>
      <div className="orbit-dsu-panel__head">
        <div>
          <p className="orbit-ops-hub__eyebrow" style={{ marginBottom: 6 }}>Daily Review</p>
          <h3 style={{ margin: 0 }}>DSU 입력</h3>
        </div>
        <span className={`orbit-notion-pill${summary?.statusSignal === "at_risk" ? " orbit-notion-pill--warn" : ""}`}>{progressLabel}</span>
      </div>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        DSU는 기록용 메모가 아니라 오늘 계획을 조정하기 위한 입력입니다. AI는 변경 후보만 제안하고, 승인 전에는 어떤 작업도 바꾸지 않습니다.
      </p>
      {disabled ? (
        <p style={{ margin: 0, color: "var(--orbit-warning)", fontSize: 12 }}>
          {disabledReason ?? "DSU is unavailable right now."}
        </p>
      ) : null}
      <div className="orbit-dsu-panel__guide">
        <span>어제: 실제로 끝낸 것</span>
        <span>오늘: 지금부터 진행할 것</span>
        <span>블로커: 멈춘 이유와 필요한 도움</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Yesterday
          <textarea
            className="orbit-input"
            style={{ minHeight: 68, resize: "vertical" }}
            value={yesterday}
            onChange={(event) => setYesterday(event.target.value)}
            placeholder="어제 완료한 작업"
            disabled={disabled || submitting}
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
            disabled={disabled || submitting}
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
            disabled={disabled || submitting}
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
            disabled={disabled || submitting}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="orbit-button" type="button" onClick={handleSubmit} disabled={disabled || submitting}>
          {submitting ? "제출 중..." : "DSU 제출"}
        </button>
        <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>제출 후 AI suggestion draft가 생성됩니다.</span>
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
