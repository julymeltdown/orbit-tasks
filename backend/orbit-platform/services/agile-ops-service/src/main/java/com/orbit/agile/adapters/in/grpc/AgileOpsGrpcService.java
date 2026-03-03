package com.orbit.agile.adapters.in.grpc;

import com.orbit.agile.application.service.DSUNormalizationService;
import com.orbit.agile.application.service.SprintPlanningService;
import com.orbit.agile.domain.DSUEntry;
import java.util.UUID;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class AgileOpsGrpcService {
    private final SprintPlanningService sprintPlanningService;
    private final DSUNormalizationService normalizationService;

    public AgileOpsGrpcService(SprintPlanningService sprintPlanningService,
                               DSUNormalizationService normalizationService) {
        this.sprintPlanningService = sprintPlanningService;
        this.normalizationService = normalizationService;
    }

    public DSUEntry submitDsu(String workspaceId, String sprintId, String authorId, String rawText) {
        DSUEntry entry = normalizationService.normalize(
                UUID.fromString(workspaceId),
                UUID.fromString(sprintId),
                authorId,
                rawText);
        return sprintPlanningService.appendDsu(entry);
    }
}
