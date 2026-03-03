interface PresenceBadgeProps {
  presence: "online" | "focus" | "offline";
  label?: string;
}

const PRESENCE_COLOR: Record<PresenceBadgeProps["presence"], string> = {
  online: "#007a5a",
  focus: "#0055ff",
  offline: "#8a96b8"
};

const PRESENCE_TEXT: Record<PresenceBadgeProps["presence"], string> = {
  online: "Online",
  focus: "Focus",
  offline: "Offline"
};

export function PresenceBadge({ presence, label }: PresenceBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid var(--orbit-border)",
        background: "var(--orbit-surface-1)",
        padding: "6px 8px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em"
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          background: PRESENCE_COLOR[presence],
          boxShadow: `0 0 10px ${PRESENCE_COLOR[presence]}`
        }}
      />
      {label ?? PRESENCE_TEXT[presence]}
    </span>
  );
}
