package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.ErrorResponse;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class RestExceptionHandler {
    private static final Map<String, HttpStatus> BUSINESS_STATUS = Map.of(
            "DEPENDENCY_CYCLE", HttpStatus.CONFLICT,
            "LOW_CONFIDENCE", HttpStatus.UNPROCESSABLE_ENTITY,
            "CONFIRMATION_REQUIRED", HttpStatus.CONFLICT,
            "INVALID_SCOPE", HttpStatus.FORBIDDEN,
            "NO_ACTIVE_SPRINT", HttpStatus.NOT_FOUND
    );

    @ExceptionHandler(StatusRuntimeException.class)
    public ResponseEntity<ErrorResponse> handleGrpc(StatusRuntimeException ex) {
        HttpStatus status = mapGrpcStatus(ex.getStatus());
        return ResponseEntity.status(status)
                .body(errorResponse(status, ex.getStatus().getDescription()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
                .body(errorResponse(HttpStatus.BAD_REQUEST, message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(errorResponse(HttpStatus.valueOf(ex.getStatusCode().value()), ex.getReason()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegal(IllegalArgumentException ex) {
        String code = Optional.ofNullable(ex.getMessage()).orElse("GATEWAY_BAD_REQUEST");
        HttpStatus status = BUSINESS_STATUS.getOrDefault(code, HttpStatus.BAD_REQUEST);
        String message = switch (code) {
            case "DEPENDENCY_CYCLE" -> "Dependency cycle detected";
            case "LOW_CONFIDENCE" -> "Suggestion confidence is too low to apply";
            case "CONFIRMATION_REQUIRED" -> "No approved suggestion to apply";
            case "INVALID_SCOPE" -> "Invalid workspace or project scope";
            case "NO_ACTIVE_SPRINT" -> "No active sprint found";
            default -> ex.getMessage();
        };
        return ResponseEntity.status(status)
                .body(errorResponse(status, code, message));
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    public ResponseEntity<ErrorResponse> handleMultipart(Exception ex) {
        HttpStatus status = HttpStatus.PAYLOAD_TOO_LARGE;
        return ResponseEntity.status(status)
                .body(errorResponse(status, "Avatar image must be <= 5MB"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleFallback(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage()));
    }

    private HttpStatus mapGrpcStatus(Status status) {
        return switch (status.getCode()) {
            case INVALID_ARGUMENT -> HttpStatus.BAD_REQUEST;
            case UNAUTHENTICATED -> HttpStatus.UNAUTHORIZED;
            case PERMISSION_DENIED -> HttpStatus.FORBIDDEN;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case ALREADY_EXISTS, ABORTED -> HttpStatus.CONFLICT;
            case FAILED_PRECONDITION -> HttpStatus.PRECONDITION_FAILED;
            case RESOURCE_EXHAUSTED -> HttpStatus.TOO_MANY_REQUESTS;
            case DEADLINE_EXCEEDED -> HttpStatus.GATEWAY_TIMEOUT;
            case UNIMPLEMENTED -> HttpStatus.NOT_IMPLEMENTED;
            case UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            case INTERNAL, DATA_LOSS -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }

    private ErrorResponse errorResponse(HttpStatus status, String message) {
        return errorResponse(status, errorCode(status), message);
    }

    private ErrorResponse errorResponse(HttpStatus status, String code, String message) {
        return new ErrorResponse(code, message, traceId(), Instant.now(), null);
    }

    private String traceId() {
        return Optional.ofNullable(MDC.get("traceId")).orElseGet(() -> UUID.randomUUID().toString());
    }

    private String errorCode(HttpStatus status) {
        return "GATEWAY_" + status.name();
    }
}
