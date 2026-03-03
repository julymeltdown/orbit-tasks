package com.orbit.migration.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ImportValidationService {

    public ValidationReport validate(ImportPreviewRequest request) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (request.mapping() == null || request.mapping().isEmpty()) {
            errors.add("mapping is required");
        }
        if (!List.of("trello", "monday", "notion").contains(request.sourceSystem().toLowerCase())) {
            errors.add("unsupported source system");
        }
        if (!request.includeComments()) {
            warnings.add("comments are not included and will be linked as external references");
        }
        if (request.includeAttachments() && !request.hasAttachmentPermission()) {
            warnings.add("attachments will be linked because source permission is insufficient");
        }

        return new ValidationReport(errors.isEmpty(), errors, warnings);
    }

    public record ImportPreviewRequest(
            String sourceSystem,
            String sourceRef,
            Map<String, String> mapping,
            boolean includeComments,
            boolean includeAttachments,
            boolean hasAttachmentPermission
    ) {
    }

    public record ValidationReport(boolean valid, List<String> errors, List<String> warnings) {
    }
}
