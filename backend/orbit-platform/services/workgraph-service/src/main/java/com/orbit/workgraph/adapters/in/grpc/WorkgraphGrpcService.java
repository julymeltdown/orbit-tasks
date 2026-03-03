package com.orbit.workgraph.adapters.in.grpc;

import com.orbit.workgraph.application.service.WorkgraphService;
import com.orbit.workgraph.v1.AddDependencyRequest;
import com.orbit.workgraph.v1.CreateWorkItemRequest;
import com.orbit.workgraph.v1.CreateWorkItemResponse;
import com.orbit.workgraph.v1.ListWorkItemsRequest;
import com.orbit.workgraph.v1.ListWorkItemsResponse;
import com.orbit.workgraph.v1.UpdateWorkItemStatusRequest;
import com.orbit.workgraph.v1.UpdateWorkItemStatusResponse;
import com.orbit.workgraph.v1.WorkItemMessage;
import com.orbit.workgraph.v1.WorkgraphGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class WorkgraphGrpcService extends WorkgraphGrpc.WorkgraphImplBase {
    private final WorkgraphService workgraphService;

    public WorkgraphGrpcService(WorkgraphService workgraphService) {
        this.workgraphService = workgraphService;
    }

    @Override
    public void createWorkItem(CreateWorkItemRequest request, StreamObserver<CreateWorkItemResponse> responseObserver) {
        try {
            var item = workgraphService.create(
                    UUID.fromString(request.getProjectId()),
                    request.getType(),
                    request.getTitle(),
                    request.getAssignee(),
                    request.getStartAt().isBlank() ? null : java.time.Instant.parse(request.getStartAt()),
                    request.getDueAt().isBlank() ? null : java.time.Instant.parse(request.getDueAt()),
                    request.getPriority());
            responseObserver.onNext(CreateWorkItemResponse.newBuilder().setWorkItem(toProto(item)).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void updateWorkItemStatus(UpdateWorkItemStatusRequest request,
                                     StreamObserver<UpdateWorkItemStatusResponse> responseObserver) {
        try {
            var updated = workgraphService.updateStatus(UUID.fromString(request.getWorkItemId()), request.getStatus());
            responseObserver.onNext(UpdateWorkItemStatusResponse.newBuilder().setWorkItem(toProto(updated)).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void addDependency(AddDependencyRequest request, StreamObserver<com.orbit.workgraph.v1.AddDependencyResponse> responseObserver) {
        try {
            workgraphService.addDependency(UUID.fromString(request.getFromWorkItemId()), UUID.fromString(request.getToWorkItemId()));
            responseObserver.onNext(com.orbit.workgraph.v1.AddDependencyResponse.newBuilder().setAccepted(true).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listWorkItems(ListWorkItemsRequest request, StreamObserver<ListWorkItemsResponse> responseObserver) {
        ListWorkItemsResponse.Builder builder = ListWorkItemsResponse.newBuilder();
        workgraphService.list().forEach(item -> builder.addWorkItems(toProto(item)));
        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    private WorkItemMessage toProto(com.orbit.workgraph.domain.WorkItem item) {
        return WorkItemMessage.newBuilder()
                .setWorkItemId(item.id().toString())
                .setProjectId(item.projectId().toString())
                .setType(item.type())
                .setTitle(item.title())
                .setStatus(item.status())
                .setAssignee(item.assignee() == null ? "" : item.assignee())
                .setStartAt(item.startAt() == null ? "" : item.startAt().toString())
                .setDueAt(item.dueAt() == null ? "" : item.dueAt().toString())
                .setPriority(item.priority())
                .build();
    }
}
