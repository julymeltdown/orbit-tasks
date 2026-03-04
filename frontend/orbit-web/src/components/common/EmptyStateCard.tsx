import type { ReactNode } from "react";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: Action[];
}

export function EmptyStateCard({ title, description, icon, actions = [] }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 18, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
        {icon ? (
          <div className="orbit-panel" style={{ minWidth: 40, minHeight: 40, display: "grid", placeItems: "center" }}>
            {icon}
          </div>
        ) : null}
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ marginBottom: 0, color: "var(--orbit-text-subtle)" }}>{description}</p>
        </div>
      </div>

      {actions.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
    </article>
  );
}

