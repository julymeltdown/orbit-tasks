import { useMemo, useState } from "react";
import type { DSUSuggestion } from "@/features/workitems/types";

interface Props {
  suggestions: DSUSuggestion[];
  applying: boolean;
  onApply: (items: Array<{ suggestionId: string; approved: boolean; overrideChange?: Record<string, unknown> }>) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
  workItemTitleById?: Record<string, string>;
}

function formatChange(targetType: string, proposedChange: Record<string, unknown>) {
  if (targetType === "QUESTION") {
    return typeof proposedChange.question === "string" ? proposedChange.question : "추가 확인이 필요합니다.";
  }

  const parts: string[] = [];
  if (typeof proposedChange.status === "string") {
    parts.push(`상태를 ${proposedChange.status}로 변경`);
  }
  if (typeof proposedChange.blockedReason === "string") {
    parts.push(`블로커 기록: ${proposedChange.blockedReason}`);
  }
  if (typeof proposedChange.logText === "string") {
    parts.push("활동 로그 추가");
  }
  if (typeof proposedChange.minutesGuess === "number") {
    parts.push(`작업 시간 ${proposedChange.minutesGuess}분`);
  }
  return parts.length > 0 ? parts.join(" · ") : "작업 변경 초안 검토";
}

export function DSUSuggestionReviewPanel({
  suggestions,
  applying,
  onApply,
  disabled = false,
  disabledReason,
  workItemTitleById = {}
}: Props) {
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => {
    return suggestions.map((suggestion) => ({
      ...suggestion,
      approved: approvedMap[suggestion.suggestionId] ?? suggestion.approved
    }));
  }, [approvedMap, suggestions]);

  async function applyApproved() {
    if (disabled) {
      setError(disabledReason ?? "Suggestions are locked");
      return;
    }
    const payload = normalized.map((entry) => ({
      suggestionId: entry.suggestionId,
      approved: entry.approved
    }));
    try {
      setError(null);
      await onApply(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply suggestions");
    }
  }

  return (
    <article className="orbit-dsu-panel" aria-disabled={disabled}>
      <div className="orbit-dsu-panel__head">
        <div>
          <p className="orbit-ops-hub__eyebrow" style={{ marginBottom: 6 }}>Approval Required</p>
          <h3 style={{ margin: 0 }}>AI Suggestion Review</h3>
        </div>
        <span className="orbit-notion-pill">{normalized.length} drafts</span>
      </div>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        아래 제안은 아직 적용되지 않았습니다. 무엇이 왜 바뀌는지 읽고 승인한 항목만 반영됩니다.
      </p>
      {disabled ? (
        <p style={{ margin: 0, color: "var(--orbit-warning)", fontSize: 12 }}>
          {disabledReason ?? "Suggestions are unavailable right now."}
        </p>
      ) : null}
      {normalized.length === 0 ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>제안이 아직 없습니다. DSU를 제출하면 AI가 승인 대기 초안을 생성합니다.</p>
      ) : (
        <div className="orbit-dsu-review-list">
          {normalized.map((suggestion) => (
            <label
              key={suggestion.suggestionId}
              className={`orbit-dsu-review-card orbit-animate-row${suggestion.confidence < 0.6 ? " is-low-confidence" : ""}`}
            >
              <div className="orbit-dsu-review-card__head">
                <strong>
                  {suggestion.targetId
                    ? workItemTitleById[suggestion.targetId] ?? suggestion.targetId
                    : suggestion.targetType === "QUESTION"
                      ? "확인 질문"
                      : suggestion.targetType}
                </strong>
                <span style={{ fontSize: 12, color: suggestion.confidence < 0.6 ? "var(--orbit-warning)" : "var(--orbit-text-subtle)" }}>
                  신뢰도 {(suggestion.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="orbit-dsu-review-card__summary">{formatChange(suggestion.targetType, suggestion.proposedChange)}</div>
              <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{suggestion.reason}</div>
              <details className="orbit-dsu-review-card__details">
                <summary>원본 제안 JSON 보기</summary>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(suggestion.proposedChange, null, 2)}</pre>
              </details>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={approvedMap[suggestion.suggestionId] ?? suggestion.approved}
                  onChange={(event) => setApprovedMap((prev) => ({ ...prev, [suggestion.suggestionId]: event.target.checked }))}
                  disabled={disabled || applying || suggestion.confidence < 0.6}
                />
                {suggestion.confidence < 0.6 ? "저신뢰 제안: 승인 대신 확인 필요" : "이 제안을 승인"}
              </span>
            </label>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="orbit-button" type="button" onClick={applyApproved} disabled={disabled || applying || normalized.length === 0}>
          {applying ? "반영 중..." : "승인한 제안 반영"}
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </article>
  );
}
