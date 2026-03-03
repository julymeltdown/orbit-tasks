package com.orbit.schedule.application.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class EvaluationSchemaValidator {

    public ValidationResult validate(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return ValidationResult.invalid(List.of("payload is empty"));
        }

        List<String> requiredFields = List.of("health", "top_risks", "questions", "confidence");
        List<String> errors = requiredFields.stream()
                .filter(field -> !payload.containsKey(field))
                .map(field -> "missing field: " + field)
                .toList();

        Object confidence = payload.get("confidence");
        if (confidence instanceof Number number) {
            double value = number.doubleValue();
            if (value < 0 || value > 1) {
                return ValidationResult.invalid(append(errors, "confidence out of range"));
            }
        }

        if (!errors.isEmpty()) {
            return ValidationResult.invalid(errors);
        }
        return ValidationResult.valid();
    }

    private List<String> append(List<String> errors, String extra) {
        return java.util.stream.Stream.concat(errors.stream(), java.util.stream.Stream.of(extra)).toList();
    }

    public record ValidationResult(boolean valid, List<String> errors) {
        static ValidationResult valid() {
            return new ValidationResult(true, List.of());
        }

        static ValidationResult invalid(List<String> errors) {
            return new ValidationResult(false, errors == null ? List.of("invalid payload") : errors);
        }
    }
}
