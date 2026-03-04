import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { TeamDirectoryPanel, TeamMember } from "@/components/team/TeamDirectoryPanel";
import { useTeamRoleMutations } from "@/features/team/hooks/useTeamRoleMutations";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface TeamView {
  teamId: string;
  workspaceId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export function TeamManagementPage() {
  const userId = useAuthStore((state) => state.userId) ?? "admin@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [teamRegistry, setTeamRegistry] = useState<TeamView[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [team, setTeam] = useState<TeamView | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("Core Delivery");
  const [invitee, setInvitee] = useState("");
  const [inviteRole, setInviteRole] = useState("TEAM_MEMBER");
  const [loading, setLoading] = useState(false);

  const teamId = useMemo(() => team?.teamId ?? "", [team?.teamId]);
  const { updateRole } = useTeamRoleMutations(teamId);

  const registryKey = useMemo(() => {
    return activeWorkspaceId ? `orbit.workspace.teams.${activeWorkspaceId}` : null;
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!registryKey) {
      setTeamRegistry([]);
      setSelectedTeamId("");
      setTeam(null);
      setMembers([]);
      return;
    }
    const raw = localStorage.getItem(registryKey);
    if (!raw) {
      setTeamRegistry([]);
      setSelectedTeamId("");
      setTeam(null);
      setMembers([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TeamView[];
      setTeamRegistry(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTeamRegistry([]);
    }
  }, [registryKey]);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeam(null);
      setMembers([]);
      return;
    }
    const selected = teamRegistry.find((candidate) => candidate.teamId === selectedTeamId) ?? null;
    setTeam(selected);
  }, [selectedTeamId, teamRegistry]);

  useEffect(() => {
    if (!team?.teamId) {
      return;
    }
    request<TeamMember[]>(`/api/teams/${team.teamId}/members`)
      .then((list) => setMembers(list))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load team members"));
  }, [team?.teamId]);

  function persistRegistry(next: TeamView[]) {
    setTeamRegistry(next);
    if (registryKey) {
      localStorage.setItem(registryKey, JSON.stringify(next));
    }
  }

  async function createTeam() {
    if (!activeWorkspaceId) {
      setError("Select workspace first");
      return;
    }
    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await request<TeamView>("/api/teams", {
        method: "POST",
        body: {
          workspaceId: activeWorkspaceId,
          name: teamName.trim(),
          createdBy: userId
        }
      });
      const next = [created, ...teamRegistry.filter((entry) => entry.teamId !== created.teamId)];
      persistRegistry(next);
      setSelectedTeamId(created.teamId);
      setTeamName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  }

  async function inviteMember() {
    if (!team?.teamId) {
      setError("Create or select team first");
      return;
    }
    if (!invitee.trim()) {
      setError("Invitee is required");
      return;
    }
    setError(null);
    try {
      const created = await request<TeamMember>(`/api/teams/${team.teamId}/members`, {
        method: "POST",
        body: {
          userId: invitee.trim(),
          role: inviteRole,
          invitedBy: userId
        }
      });
      setMembers((prev) => [created, ...prev]);
      setInvitee("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    }
  }

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

  async function onRemove(userId: string) {
    await onRoleChange(userId, "REMOVED");
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Team Management</h2>

        {error && <p style={{ color: "var(--orbit-danger)" }}>{error}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11.25rem, 1fr))", gap: 8 }}>
          <input className="orbit-input" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="New team name" />
          <button className="orbit-button" type="button" onClick={createTeam} disabled={loading}>
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <select className="orbit-input" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
            <option value="">Select team...</option>
            {teamRegistry.map((entry) => (
              <option key={entry.teamId} value={entry.teamId}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        {team ? (
          <>
            <p style={{ marginBottom: 12, marginTop: 10 }}>
              Active team: <strong>{team.name}</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: 8, marginBottom: 12 }}>
              <input className="orbit-input" value={invitee} onChange={(event) => setInvitee(event.target.value)} placeholder="Invite user id or handle" />
              <select className="orbit-input" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                <option value="TEAM_ADMIN">TEAM_ADMIN</option>
                <option value="OBSERVER">OBSERVER</option>
              </select>
              <button className="orbit-button orbit-button--ghost" type="button" onClick={inviteMember}>
                Invite
              </button>
            </div>
            <TeamDirectoryPanel members={members} onRoleChange={onRoleChange} onRemove={onRemove} />
          </>
        ) : (
          <p>Select a team to manage members.</p>
        )}
      </article>
    </section>
  );
}
