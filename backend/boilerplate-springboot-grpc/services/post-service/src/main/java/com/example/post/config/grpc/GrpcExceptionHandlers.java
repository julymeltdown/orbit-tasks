package com.example.post.config.grpc;

import io.grpc.Status;
import io.grpc.StatusException;
import io.grpc.StatusRuntimeException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.grpc.server.exception.GrpcExceptionHandler;
import org.springframework.security.core.AuthenticationException;

@Configuration
public class GrpcExceptionHandlers {
    @Bean
    public GrpcExceptionHandler illegalArgumentHandler() {
        return throwable -> {
            if (throwable instanceof IllegalArgumentException) {
                return Status.INVALID_ARGUMENT
                        .withDescription(throwable.getMessage())
                        .asException();
            }
            return null;
        };
    }

    @Bean
    public GrpcExceptionHandler genericHandler() {
        return throwable -> {
            if (throwable instanceof StatusException statusException) {
                return statusException;
            }
            if (throwable instanceof StatusRuntimeException statusRuntimeException) {
                return statusRuntimeException.getStatus().asException();
            }
            if (throwable instanceof AuthenticationException) {
                return Status.UNAUTHENTICATED
                        .withDescription("Unauthorized")
                        .asException();
            }
            return Status.INTERNAL
                    .withDescription("Internal error")
                    .asException();
        };
    }
}
