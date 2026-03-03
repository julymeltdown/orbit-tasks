import { request } from "@/lib/http/client";

export function useTeamRoleMutations(teamId: string) {
  async function updateRole(userId: string, role: string) {
    return request(`/api/teams/${teamId}/members/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      body: {
        role,
        actorRole: "TEAM_ADMIN"
      }
    });
  }

  return {
    updateRole
  };
}
