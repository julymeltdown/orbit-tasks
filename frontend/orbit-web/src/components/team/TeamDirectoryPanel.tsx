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
}

export function TeamDirectoryPanel({ members, onRoleChange }: TeamDirectoryPanelProps) {
  return (
    <div className="orbit-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Team Directory</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {members.map((member) => (
          <div key={member.membershipId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <strong>{member.userId}</strong>
              <p style={{ margin: "4px 0 0", color: "var(--orbit-text-subtle)", fontSize: 12 }}>
                invited by {member.invitedBy}
              </p>
            </div>
            <select
              className="orbit-input"
              style={{ width: 180 }}
              value={member.role}
              onChange={(event) => onRoleChange(member.userId, event.target.value)}
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="TEAM_ADMIN">Team Admin</option>
              <option value="OBSERVER">Observer</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
