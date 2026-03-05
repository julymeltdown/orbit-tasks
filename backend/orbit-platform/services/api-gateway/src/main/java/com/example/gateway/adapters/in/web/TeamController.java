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
    private final Map<UUID, List<InviteView>> invitesByTeam = new ConcurrentHashMap<>();

    // legacy compatibility
    @PostMapping("/api/teams")
    public TeamView createTeamLegacy(@Valid @RequestBody CreateTeamRequest request) {
        return createTeamV2(request);
    }

    @PostMapping("/api/v2/teams")
    public TeamView createTeamV2(@Valid @RequestBody CreateTeamRequest request) {
        TeamView team = new TeamView(UUID.randomUUID(), UUID.fromString(request.workspaceId()), request.name(), request.createdBy(), Instant.now().toString());
        teams.put(team.teamId(), team);
        memberships.computeIfAbsent(team.teamId(), key -> new ArrayList<>()).add(
                new MemberView(UUID.randomUUID(), team.teamId(), request.createdBy(), "TEAM_ADMIN", request.createdBy(), Instant.now().toString()));
        invitesByTeam.putIfAbsent(team.teamId(), new ArrayList<>());
        return team;
    }

    // legacy compatibility
    @PostMapping("/api/teams/{teamId}/members")
    public MemberView inviteLegacy(@PathVariable UUID teamId, @Valid @RequestBody InviteMemberRequest request) {
        InviteView invite = inviteV2(teamId, new InviteMemberV2Request(request.userId(), request.role(), request.invitedBy(), null));
        return new MemberView(UUID.randomUUID(), teamId, invite.invitee(), invite.role(), invite.invitedBy(), Instant.now().toString());
    }

    @PostMapping("/api/v2/teams/{teamId}/invites")
    public InviteView inviteV2(@PathVariable UUID teamId, @Valid @RequestBody InviteMemberV2Request request) {
        requireTeam(teamId);
        InviteView invite = new InviteView(
                UUID.randomUUID(),
                teamId,
                request.invitee(),
                request.role(),
                request.invitedBy(),
                "PENDING",
                Instant.now().toString());
        invitesByTeam.computeIfAbsent(teamId, ignored -> new ArrayList<>()).add(invite);
        return invite;
    }

    // legacy compatibility
    @PatchMapping("/api/teams/{teamId}/members/{userId}/role")
    public MemberView updateRoleLegacy(@PathVariable UUID teamId,
                                       @PathVariable String userId,
                                       @Valid @RequestBody UpdateRoleRequest request) {
        return patchMemberV2(teamId, userId, new PatchMemberV2Request(request.role(), request.actorRole(), null));
    }

    @PatchMapping("/api/v2/teams/{teamId}/members/{userId}")
    public MemberView patchMemberV2(@PathVariable UUID teamId,
                                    @PathVariable String userId,
                                    @Valid @RequestBody PatchMemberV2Request request) {
        if (!"WORKSPACE_ADMIN".equals(request.actorRole()) && !"TEAM_ADMIN".equals(request.actorRole())) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
        List<MemberView> memberViews = memberships.computeIfAbsent(teamId, ignored -> new ArrayList<>());
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

        MemberView created = new MemberView(UUID.randomUUID(), teamId, userId, request.role(), request.actorRole(), Instant.now().toString());
        memberViews.add(created);
        return created;
    }

    // legacy compatibility
    @GetMapping("/api/teams/{teamId}/members")
    public List<MemberView> listMembersLegacy(@PathVariable UUID teamId) {
        return listMembersV2(teamId);
    }

    @GetMapping("/api/v2/teams/{teamId}/members")
    public List<MemberView> listMembersV2(@PathVariable UUID teamId) {
        requireTeam(teamId);
        return List.copyOf(memberships.getOrDefault(teamId, List.of()));
    }

    @GetMapping("/api/v2/teams/{teamId}/invites")
    public List<InviteView> listInvitesV2(@PathVariable UUID teamId) {
        requireTeam(teamId);
        return List.copyOf(invitesByTeam.getOrDefault(teamId, List.of()));
    }

    private TeamView requireTeam(UUID teamId) {
        TeamView team = teams.get(teamId);
        if (team == null) {
            throw new IllegalArgumentException("INVALID_SCOPE");
        }
        return team;
    }

    public record CreateTeamRequest(@NotBlank String workspaceId, @NotBlank String name, @NotBlank String createdBy) {
    }

    public record InviteMemberRequest(@NotBlank String userId, @NotBlank String role, @NotBlank String invitedBy) {
    }

    public record InviteMemberV2Request(@NotBlank String invitee, @NotBlank String role, @NotBlank String invitedBy, Map<String, Object> metadata) {
    }

    public record UpdateRoleRequest(@NotBlank String role, @NotBlank String actorRole) {
    }

    public record PatchMemberV2Request(@NotBlank String role, @NotBlank String actorRole, String note) {
    }

    public record TeamView(UUID teamId, UUID workspaceId, String name, String createdBy, String createdAt) {
    }

    public record MemberView(UUID membershipId, UUID teamId, String userId, String role, String invitedBy, String createdAt) {
    }

    public record InviteView(UUID inviteId, UUID teamId, String invitee, String role, String invitedBy, String status, String createdAt) {
    }
}
