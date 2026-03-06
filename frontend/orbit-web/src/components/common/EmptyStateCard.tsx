import type { ReactNode } from "react";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

interface Props {
  title: string;
  description: string;
  statusHint?: string;
  icon?: ReactNode;
  actions?: Action[];
  secondaryActions?: Action[];
  learnMoreHref?: string;
  learnMoreLabel?: string;
}

export function EmptyStateCard({
  title,
  description,
  statusHint,
  icon,
  actions = [],
  secondaryActions = [],
  learnMoreHref,
  learnMoreLabel = "자세히 보기"
}: Props) {
  return (
    <article className="orbit-empty-state">
      <div className="orbit-empty-state__head">
        {icon ? (
          <div className="orbit-empty-state__icon">
            {icon}
          </div>
        ) : null}
        <div>
          {statusHint ? <p className="orbit-empty-state__hint">{statusHint}</p> : null}
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ marginBottom: 0, color: "var(--orbit-text-subtle)" }}>{description}</p>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="orbit-empty-state__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`orbit-button${action.variant === "ghost" ? " orbit-button--ghost" : ""}`}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {secondaryActions.length > 0 || learnMoreHref ? (
        <div className="orbit-empty-state__secondary">
          {secondaryActions.map((action) => (
            <button
              key={action.label}
              className={`orbit-button${action.variant === "primary" ? "" : " orbit-button--ghost"}`}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
          {learnMoreHref ? (
            <a className="orbit-link-button orbit-link-button--tab" href={learnMoreHref}>
              {learnMoreLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
