package com.orbit.identity.adapters.in.grpc;

import com.orbit.identity.application.service.SessionService;
import com.orbit.identity.domain.WorkspaceClaim;
import com.orbit.identity.v1.GetWorkspaceClaimsRequest;
import com.orbit.identity.v1.GetWorkspaceClaimsResponse;
import com.orbit.identity.v1.IdentityAccessServiceGrpc;
import com.orbit.identity.v1.WorkspaceClaimMessage;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.List;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class IdentityGrpcService extends IdentityAccessServiceGrpc.IdentityAccessServiceImplBase {
    private final SessionService sessionService;

    public IdentityGrpcService(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public void getWorkspaceClaims(GetWorkspaceClaimsRequest request,
                                   StreamObserver<GetWorkspaceClaimsResponse> responseObserver) {
        try {
            UUID userId = UUID.fromString(request.getUserId());
            List<WorkspaceClaim> claims = sessionService.workspaceClaims(userId);

            GetWorkspaceClaimsResponse.Builder builder = GetWorkspaceClaimsResponse.newBuilder();
            for (WorkspaceClaim claim : claims) {
                builder.addClaims(WorkspaceClaimMessage.newBuilder()
                        .setWorkspaceId(claim.workspaceId().toString())
                        .setWorkspaceName(claim.workspaceName())
                        .setRole(claim.role())
                        .setDefaultWorkspace(claim.defaultWorkspace())
                        .build());
            }
            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("Invalid user id")
                    .withCause(ex)
                    .asRuntimeException());
        }
    }
}
