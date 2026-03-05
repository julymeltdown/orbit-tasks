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

interface InviteView {
  inviteId: string;
  teamId: string;
  invitee: string;
  role: string;
  invitedBy: string;
  status: string;
  createdAt: string;
}

export function TeamManagementPage() {
  const userId = useAuthStore((state) => state.userId) ?? "admin@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [teamRegistry, setTeamRegistry] = useState<TeamView[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [team, setTeam] = useState<TeamView | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<InviteView[]>([]);
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
      setInvites([]);
      return;
    }
    const selected = teamRegistry.find((candidate) => candidate.teamId === selectedTeamId) ?? null;
    setTeam(selected);
  }, [selectedTeamId, teamRegistry]);

  useEffect(() => {
    if (!team?.teamId) {
      return;
    }
    Promise.all([
      request<TeamMember[]>(`/api/v2/teams/${team.teamId}/members`),
      request<InviteView[]>(`/api/v2/teams/${team.teamId}/invites`)
    ])
      .then(([memberList, inviteList]) => {
        setMembers(memberList);
        setInvites(inviteList);
      })
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
      const created = await request<TeamView>("/api/v2/teams", {
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
    const normalizedInvitee = invitee.trim();
    const inviteePattern = /^([a-zA-Z0-9._-]+|[^\s@]+@[^\s@]+\.[^\s@]+)$/;
    if (!inviteePattern.test(normalizedInvitee)) {
      setError("Use email or handle (letters, numbers, . _ -)");
      return;
    }
    setError(null);
    try {
      const created = await request<InviteView>(`/api/v2/teams/${team.teamId}/invites`, {
        method: "POST",
        body: {
          invitee: normalizedInvitee,
          role: inviteRole,
          invitedBy: userId,
          metadata: {
            source: "team-management-page"
          }
        }
      });
      setInvites((prev) => [created, ...prev]);
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
              <input className="orbit-input" value={invitee} onChange={(event) => setInvitee(event.target.value)} placeholder="Invite email or handle" />
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
            <article className="orbit-card" style={{ padding: 16, marginTop: 12 }}>
              <h3 style={{ marginTop: 0 }}>Pending Invites</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {invites.map((invite) => (
                  <div
                    key={invite.inviteId}
                    className="orbit-panel orbit-animate-row"
                    style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}
                  >
                    <strong>{invite.invitee}</strong>
                    <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                      {invite.role} · {invite.status} · {new Date(invite.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
                {invites.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No pending invites.</p> : null}
              </div>
            </article>
          </>
        ) : (
          <p>Select a team to manage members.</p>
        )}
      </article>
    </section>
  );
}
