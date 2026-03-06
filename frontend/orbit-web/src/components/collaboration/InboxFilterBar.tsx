import { type InboxFilter, getInboxFilterLabel } from "@/features/collaboration/inboxPresentation";

interface Props {
  value: InboxFilter;
  counts: Record<InboxFilter, number>;
  onChange: (value: InboxFilter) => void;
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

const FILTERS: InboxFilter[] = ["all", "needs_action", "mentions", "ai_questions", "resolved"];

export function InboxFilterBar({ value, counts, unreadCount, onChange, onMarkAllRead, onRefresh }: Props) {
  return (
    <section className="orbit-inbox-filterbar" aria-label="Inbox triage filters">
      <nav className="orbit-inbox-filterbar__tabs" role="tablist" aria-label="Inbox categories">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            role="tab"
            aria-selected={value === filter}
            className={`orbit-link-button orbit-link-button--tab${value === filter ? " is-active" : ""}`}
            type="button"
            onClick={() => onChange(filter)}
          >
            <span>{getInboxFilterLabel(filter)}</span>
            <span className="orbit-inbox-filterbar__count">{counts[filter] ?? 0}</span>
          </button>
        ))}
      </nav>
      <section className="orbit-inbox-filterbar__actions" aria-label="Inbox actions">
        <span className="orbit-inbox-filterbar__meta">미확인 {unreadCount}</span>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onMarkAllRead}>
          모두 읽음 처리
        </button>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onRefresh}>
          새로고침
        </button>
      </section>
    </section>
  );
}

export type { InboxFilter };
