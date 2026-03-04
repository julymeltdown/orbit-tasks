export interface TeamMember {
  membershipId: string;
  teamId: string;
  userId: string;
  role: string;
  invitedBy: string;
  createdAt: string;
}

interface TeamDirectoryPanelProps {
  members: TeamMember[];
  onRoleChange: (userId: string, nextRole: string) => void;
  onRemove?: (userId: string) => void;
}

export function TeamDirectoryPanel({ members, onRoleChange, onRemove }: TeamDirectoryPanelProps) {
  return (
    <div className="orbit-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Team Directory</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {members.map((member) => (
          <div key={member.membershipId} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>{member.userId}</strong>
              <p style={{ margin: "4px 0 0", color: "var(--orbit-text-subtle)", fontSize: 12 }}>
                invited by {member.invitedBy}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <select
                className="orbit-input"
                style={{ width: "min(100%, 220px)" }}
                value={member.role}
                onChange={(event) => onRoleChange(member.userId, event.target.value)}
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="TEAM_ADMIN">Team Admin</option>
                <option value="OBSERVER">Observer</option>
                <option value="REMOVED">Removed</option>
              </select>
              {onRemove ? (
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => onRemove(member.userId)}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
