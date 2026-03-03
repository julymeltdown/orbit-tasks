package com.orbit.migration.adapters.in.grpc;

import com.orbit.migration.application.service.ImportExecutionService;
import com.orbit.migration.application.service.ImportValidationService;
import java.util.Map;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class MigrationGrpcService {
    private final ImportValidationService validationService;
    private final ImportExecutionService executionService;

    public MigrationGrpcService(ImportValidationService validationService,
                                ImportExecutionService executionService) {
        this.validationService = validationService;
        this.executionService = executionService;
    }

    public ImportValidationService.ValidationReport preview(String sourceSystem,
                                                             String sourceRef,
                                                             Map<String, String> mapping,
                                                             boolean includeComments,
                                                             boolean includeAttachments,
                                                             boolean hasAttachmentPermission) {
        return validationService.validate(new ImportValidationService.ImportPreviewRequest(
                sourceSystem,
                sourceRef,
                mapping,
                includeComments,
                includeAttachments,
                hasAttachmentPermission));
    }

    public ImportExecutionService.ImportJob execute(String workspaceId,
                                                    String sourceSystem,
                                                    String sourceRef,
                                                    ImportValidationService.ValidationReport report,
                                                    String actor) {
        return executionService.execute(workspaceId, sourceSystem, sourceRef, report, actor);
    }
}
