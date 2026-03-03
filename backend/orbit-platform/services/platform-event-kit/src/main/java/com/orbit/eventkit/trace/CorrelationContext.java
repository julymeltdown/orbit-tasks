package com.orbit.eventkit.trace;

import java.util.Optional;
import java.util.UUID;

public final class CorrelationContext {
    private static final ThreadLocal<String> CORRELATION_ID = new ThreadLocal<>();

    private CorrelationContext() {
    }

    public static String getOrCreate() {
        String current = CORRELATION_ID.get();
        if (current == null || current.isBlank()) {
            current = UUID.randomUUID().toString();
            CORRELATION_ID.set(current);
        }
        return current;
    }

    public static Optional<String> get() {
        return Optional.ofNullable(CORRELATION_ID.get()).filter(value -> !value.isBlank());
    }

    public static void set(String correlationId) {
        CORRELATION_ID.set(correlationId);
    }

    public static void clear() {
        CORRELATION_ID.remove();
    }
}
