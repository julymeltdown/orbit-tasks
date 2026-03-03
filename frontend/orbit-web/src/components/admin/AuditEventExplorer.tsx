interface AuditEvent {
  eventId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

interface Props {
  events: AuditEvent[];
}

export function AuditEventExplorer({ events }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Audit Event Explorer</h3>
      <div style={{ maxHeight: 260, overflow: "auto", display: "grid", gap: 8 }}>
        {events.map((event) => (
          <div key={event.eventId} className="orbit-panel" style={{ padding: 10 }}>
            <strong>{event.action}</strong>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
              {event.actor} · {event.target} · {event.createdAt}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
