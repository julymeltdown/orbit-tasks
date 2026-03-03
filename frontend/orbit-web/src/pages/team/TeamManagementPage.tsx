import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { TeamDirectoryPanel, TeamMember } from "@/components/team/TeamDirectoryPanel";
import { useTeamRoleMutations } from "@/features/team/hooks/useTeamRoleMutations";

interface TeamView {
  teamId: string;
  workspaceId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export function TeamManagementPage() {
  const [team, setTeam] = useState<TeamView | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const teamId = useMemo(() => team?.teamId ?? "", [team?.teamId]);
  const { updateRole } = useTeamRoleMutations(teamId);

  useEffect(() => {
    request<TeamView>("/api/teams", {
      method: "POST",
      body: {
        workspaceId: "11111111-1111-1111-1111-111111111111",
        name: "Core Delivery",
        createdBy: "admin@orbit.local"
      }
    })
      .then((created) => {
        setTeam(created);
        return request<TeamMember[]>(`/api/teams/${created.teamId}/members`);
      })
      .then((list) => setMembers(list))
      .catch((e) => setError(e instanceof Error ? e.message : "Team bootstrap failed"));
  }, []);

  async function onRoleChange(userId: string, role: string) {
    if (!team) {
      return;
    }
    try {
      const updated = (await updateRole(userId, role)) as TeamMember;
      setMembers((prev) => prev.map((member) => (member.userId === userId ? updated : member)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role update failed");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Team Management</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Create teams, invite members, and mutate roles with RBAC checks.
        </p>

        {error && <p style={{ color: "var(--orbit-danger)" }}>{error}</p>}

        {team ? (
          <>
            <p style={{ marginBottom: 12 }}>
              Active team: <strong>{team.name}</strong>
            </p>
            <TeamDirectoryPanel members={members} onRoleChange={onRoleChange} />
          </>
        ) : (
          <p>Initializing team workspace...</p>
        )}
      </article>
    </section>
  );
}
