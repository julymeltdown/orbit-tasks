package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RestExceptionHandlerTest {
    @Test
    void mapsMultipartLimitToPayloadTooLarge() {
        RestExceptionHandler handler = new RestExceptionHandler();

        ResponseEntity<ErrorResponse> response = handler.handleMultipart(new MaxUploadSizeExceededException(1024L));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("GATEWAY_PAYLOAD_TOO_LARGE", response.getBody().code());
        assertEquals("Avatar image must be <= 5MB", response.getBody().message());
    }
}
