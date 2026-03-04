import { useMemo, useState } from "react";

interface AuditEvent {
  eventId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  payload?: Record<string, unknown>;
}

interface Props {
  events: AuditEvent[];
  onExport?: () => void;
}

export function AuditEventExplorer({ events, onExport }: Props) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const actionOptions = useMemo(() => {
    const actions = new Set(events.map((event) => event.action));
    return ["ALL", ...Array.from(actions).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const actionMatch = actionFilter === "ALL" || event.action === actionFilter;
      if (!actionMatch) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = `${event.actor} ${event.action} ${event.target} ${event.createdAt}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [actionFilter, events, query]);

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ marginTop: 0 }}>Audit Event Explorer</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="orbit-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search actor, action, target..."
          aria-label="Search audit events"
        />
        <select
          className="orbit-input"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          aria-label="Filter by action"
        >
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onExport}>
          Export JSONL
        </button>
      </div>
      <div style={{ maxHeight: 320, overflow: "auto", display: "grid", gap: 8 }}>
        {filteredEvents.map((event) => (
          <div key={event.eventId} className="orbit-panel" style={{ padding: 10 }}>
            <strong>{event.action}</strong>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
              {event.actor} · {event.target} · {event.createdAt}
            </div>
            {event.payload ? (
              <pre style={{ margin: "6px 0 0", fontSize: 11, whiteSpace: "pre-wrap", color: "var(--orbit-text-subtle)" }}>
                {JSON.stringify(event.payload)}
              </pre>
            ) : null}
          </div>
        ))}
        {filteredEvents.length === 0 ? (
          <div className="orbit-panel" style={{ padding: 12, color: "var(--orbit-text-subtle)" }}>
            No events match current filters.
          </div>
        ) : null}
      </div>
    </article>
  );
}
