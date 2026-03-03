package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.ErrorResponse;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class RestExceptionHandler {

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
        return ResponseEntity.badRequest()
                .body(errorResponse(HttpStatus.BAD_REQUEST, ex.getMessage()));
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
        return new ErrorResponse(errorCode(status), message, traceId(), Instant.now(), null);
    }

    private String traceId() {
        return Optional.ofNullable(MDC.get("traceId")).orElseGet(() -> UUID.randomUUID().toString());
    }

    private String errorCode(HttpStatus status) {
        return "GATEWAY_" + status.name();
    }
}
