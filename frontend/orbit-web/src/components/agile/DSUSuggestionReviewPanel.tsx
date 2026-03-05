import { useMemo, useState } from "react";
import type { DSUSuggestion } from "@/features/workitems/types";

interface Props {
  suggestions: DSUSuggestion[];
  applying: boolean;
  onApply: (items: Array<{ suggestionId: string; approved: boolean; overrideChange?: Record<string, unknown> }>) => Promise<void>;
}

export function DSUSuggestionReviewPanel({ suggestions, applying, onApply }: Props) {
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => {
    return suggestions.map((suggestion) => ({
      ...suggestion,
      approved: approvedMap[suggestion.suggestionId] ?? suggestion.approved
    }));
  }, [approvedMap, suggestions]);

  async function applyApproved() {
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
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>DSU Suggestion Review</h3>
      {normalized.length === 0 ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No suggestions yet. Submit DSU and run AI suggest.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {normalized.map((suggestion) => (
            <label key={suggestion.suggestionId} className="orbit-panel orbit-animate-row" style={{ padding: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <strong>{suggestion.targetType}</strong>
                <span style={{ fontSize: 12, color: suggestion.confidence < 0.6 ? "var(--orbit-warning)" : "var(--orbit-text-subtle)" }}>
                  confidence {(suggestion.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{suggestion.reason}</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(suggestion.proposedChange, null, 2)}</pre>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={approvedMap[suggestion.suggestionId] ?? suggestion.approved}
                  onChange={(event) => setApprovedMap((prev) => ({ ...prev, [suggestion.suggestionId]: event.target.checked }))}
                />
                Approve this suggestion
              </span>
            </label>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="orbit-button" type="button" onClick={applyApproved} disabled={applying || normalized.length === 0}>
          {applying ? "Applying..." : "Apply Approved Suggestions"}
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </article>
  );
}
