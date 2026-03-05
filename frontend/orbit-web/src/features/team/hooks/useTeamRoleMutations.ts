import { request } from "@/lib/http/client";

export function useTeamRoleMutations(teamId: string) {
  async function updateRole(userId: string, role: string) {
    return request(`/api/v2/teams/${teamId}/members/${encodeURIComponent(userId)}`, {
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
