package com.orbit.team.application.service;

import com.orbit.team.adapters.out.persistence.TeamMembershipEntity;
import com.orbit.team.domain.Team;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TeamLifecycleService {
    private final Clock clock;
    private final Map<UUID, Team> teams = new ConcurrentHashMap<>();
    private final Map<UUID, List<TeamMembershipEntity>> memberships = new ConcurrentHashMap<>();

    public TeamLifecycleService(Clock clock) {
        this.clock = clock;
    }

    public Team createTeam(UUID workspaceId, String name, String createdBy) {
        Team team = new Team(UUID.randomUUID(), workspaceId, name, createdBy, Instant.now(clock));
        teams.put(team.id(), team);

        TeamMembershipEntity owner = new TeamMembershipEntity(
                UUID.randomUUID(),
                team.id(),
                createdBy,
                "TEAM_ADMIN",
                createdBy,
                Instant.now(clock));
        memberships.computeIfAbsent(team.id(), key -> new ArrayList<>()).add(owner);
        return team;
    }

    public TeamMembershipEntity invite(UUID teamId, String userId, String role, String invitedBy) {
        if (!teams.containsKey(teamId)) {
            throw new IllegalArgumentException("Team not found");
        }
        TeamMembershipEntity membership = new TeamMembershipEntity(
                UUID.randomUUID(),
                teamId,
                userId,
                role,
                invitedBy,
                Instant.now(clock));
        memberships.computeIfAbsent(teamId, key -> new ArrayList<>()).add(membership);
        return membership;
    }

    public TeamMembershipEntity updateRole(UUID teamId, String userId, String role, String actorRole) {
        if (!"WORKSPACE_ADMIN".equals(actorRole) && !"TEAM_ADMIN".equals(actorRole)) {
            throw new IllegalArgumentException("Insufficient role");
        }
        List<TeamMembershipEntity> memberList = memberships.getOrDefault(teamId, List.of());
        for (int i = 0; i < memberList.size(); i++) {
            TeamMembershipEntity current = memberList.get(i);
            if (current.userId().equals(userId)) {
                TeamMembershipEntity updated = new TeamMembershipEntity(
                        current.id(),
                        current.teamId(),
                        current.userId(),
                        role,
                        current.invitedBy(),
                        current.createdAt());
                memberList.set(i, updated);
                return updated;
            }
        }
        throw new IllegalArgumentException("Membership not found");
    }

    public List<TeamMembershipEntity> list(UUID teamId) {
        return List.copyOf(memberships.getOrDefault(teamId, List.of()));
    }
}
