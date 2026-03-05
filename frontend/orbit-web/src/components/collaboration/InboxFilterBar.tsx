type InboxFilter = "all" | "notifications" | "requests" | "mentions" | "ai_questions";

interface Props {
  value: InboxFilter;
  onChange: (value: InboxFilter) => void;
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

const FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "notifications", label: "Notifications" },
  { id: "requests", label: "Requests" },
  { id: "mentions", label: "Mentions" },
  { id: "ai_questions", label: "AI Questions" }
];

export function InboxFilterBar({ value, onChange, unreadCount, onMarkAllRead, onRefresh }: Props) {
  return (
    <article className="orbit-inbox-filterbar" aria-label="Inbox filters">
      <nav className="orbit-inbox-filterbar__tabs" role="tablist" aria-label="Inbox categories">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            role="tab"
            aria-selected={value === filter.id}
            className={`orbit-link-button orbit-link-button--tab${value === filter.id ? " is-active" : ""}`}
            type="button"
            onClick={() => onChange(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </nav>
      <section className="orbit-inbox-filterbar__actions" aria-label="Inbox actions">
        <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>Unread {unreadCount}</span>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onMarkAllRead}>
          Mark all read
        </button>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </section>
    </article>
  );
}

export type { InboxFilter };
