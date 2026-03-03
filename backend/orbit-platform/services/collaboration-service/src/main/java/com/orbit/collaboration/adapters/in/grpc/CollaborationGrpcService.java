package com.orbit.collaboration.adapters.in.grpc;

import com.orbit.collaboration.application.service.ThreadService;
import com.orbit.collaboration.domain.Thread;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class CollaborationGrpcService {
    private final ThreadService threadService;

    public CollaborationGrpcService(ThreadService threadService) {
        this.threadService = threadService;
    }

    public Thread createThread(String workspaceId, String workItemId, String title, String actor) {
        return threadService.create(
                UUID.fromString(workspaceId),
                UUID.fromString(workItemId),
                title,
                actor);
    }
}
