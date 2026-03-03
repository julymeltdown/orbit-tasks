package com.orbit.team.adapters.in.grpc;

import com.orbit.team.application.service.TeamLifecycleService;
import com.orbit.team.v1.CreateTeamRequest;
import com.orbit.team.v1.CreateTeamResponse;
import com.orbit.team.v1.InviteMemberRequest;
import com.orbit.team.v1.InviteMemberResponse;
import com.orbit.team.v1.ListMembersRequest;
import com.orbit.team.v1.ListMembersResponse;
import com.orbit.team.v1.TeamGrpc;
import com.orbit.team.v1.TeamMember;
import com.orbit.team.v1.UpdateRoleRequest;
import com.orbit.team.v1.UpdateRoleResponse;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class TeamGrpcService extends TeamGrpc.TeamImplBase {
    private final TeamLifecycleService lifecycleService;

    public TeamGrpcService(TeamLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    @Override
    public void createTeam(CreateTeamRequest request, StreamObserver<CreateTeamResponse> responseObserver) {
        try {
            var team = lifecycleService.createTeam(
                    UUID.fromString(request.getWorkspaceId()),
                    request.getName(),
                    request.getCreatedBy());
            responseObserver.onNext(CreateTeamResponse.newBuilder()
                    .setTeamId(team.id().toString())
                    .setWorkspaceId(team.workspaceId().toString())
                    .setName(team.name())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void inviteMember(InviteMemberRequest request, StreamObserver<InviteMemberResponse> responseObserver) {
        try {
            var member = lifecycleService.invite(
                    UUID.fromString(request.getTeamId()),
                    request.getUserId(),
                    request.getRole(),
                    request.getInvitedBy());
            responseObserver.onNext(InviteMemberResponse.newBuilder()
                    .setMembershipId(member.id().toString())
                    .setTeamId(member.teamId().toString())
                    .setUserId(member.userId())
                    .setRole(member.role())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void updateRole(UpdateRoleRequest request, StreamObserver<UpdateRoleResponse> responseObserver) {
        try {
            var member = lifecycleService.updateRole(
                    UUID.fromString(request.getTeamId()),
                    request.getUserId(),
                    request.getRole(),
                    request.getActorRole());
            responseObserver.onNext(UpdateRoleResponse.newBuilder()
                    .setMembershipId(member.id().toString())
                    .setRole(member.role())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listMembers(ListMembersRequest request, StreamObserver<ListMembersResponse> responseObserver) {
        try {
            var members = lifecycleService.list(UUID.fromString(request.getTeamId()));
            ListMembersResponse.Builder builder = ListMembersResponse.newBuilder();
            members.forEach(member -> builder.addMembers(TeamMember.newBuilder()
                    .setMembershipId(member.id().toString())
                    .setTeamId(member.teamId().toString())
                    .setUserId(member.userId())
                    .setRole(member.role())
                    .build()));
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }
}
