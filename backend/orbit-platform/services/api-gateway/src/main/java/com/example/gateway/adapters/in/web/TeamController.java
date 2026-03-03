package com.example.gateway.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class TeamController {
    private final Map<UUID, TeamView> teams = new ConcurrentHashMap<>();
    private final Map<UUID, List<MemberView>> memberships = new ConcurrentHashMap<>();

    @PostMapping("/api/teams")
    public TeamView createTeam(@Valid @RequestBody CreateTeamRequest request) {
        TeamView team = new TeamView(UUID.randomUUID(), UUID.fromString(request.workspaceId()), request.name(), request.createdBy(), Instant.now().toString());
        teams.put(team.teamId(), team);
        memberships.computeIfAbsent(team.teamId(), key -> new ArrayList<>()).add(
                new MemberView(UUID.randomUUID(), team.teamId(), request.createdBy(), "TEAM_ADMIN", request.createdBy(), Instant.now().toString()));
        return team;
    }

    @PostMapping("/api/teams/{teamId}/members")
    public MemberView invite(@PathVariable UUID teamId, @Valid @RequestBody InviteMemberRequest request) {
        MemberView member = new MemberView(UUID.randomUUID(), teamId, request.userId(), request.role(), request.invitedBy(), Instant.now().toString());
        memberships.computeIfAbsent(teamId, key -> new ArrayList<>()).add(member);
        return member;
    }

    @PatchMapping("/api/teams/{teamId}/members/{userId}/role")
    public MemberView updateRole(@PathVariable UUID teamId,
                                 @PathVariable String userId,
                                 @Valid @RequestBody UpdateRoleRequest request) {
        if (!"WORKSPACE_ADMIN".equals(request.actorRole()) && !"TEAM_ADMIN".equals(request.actorRole())) {
            throw new IllegalArgumentException("Insufficient role");
        }

        List<MemberView> memberViews = memberships.getOrDefault(teamId, List.of());
        for (int i = 0; i < memberViews.size(); i++) {
            MemberView current = memberViews.get(i);
            if (current.userId().equals(userId)) {
                MemberView updated = new MemberView(
                        current.membershipId(),
                        current.teamId(),
                        current.userId(),
                        request.role(),
                        current.invitedBy(),
                        current.createdAt());
                memberViews.set(i, updated);
                return updated;
            }
        }

        throw new IllegalArgumentException("Membership not found");
    }

    @GetMapping("/api/teams/{teamId}/members")
    public List<MemberView> listMembers(@PathVariable UUID teamId) {
        return List.copyOf(memberships.getOrDefault(teamId, List.of()));
    }

    public record CreateTeamRequest(@NotBlank String workspaceId, @NotBlank String name, @NotBlank String createdBy) {
    }

    public record InviteMemberRequest(@NotBlank String userId, @NotBlank String role, @NotBlank String invitedBy) {
    }

    public record UpdateRoleRequest(@NotBlank String role, @NotBlank String actorRole) {
    }

    public record TeamView(UUID teamId, UUID workspaceId, String name, String createdBy, String createdAt) {
    }

    public record MemberView(UUID membershipId, UUID teamId, String userId, String role, String invitedBy, String createdAt) {
    }
}
