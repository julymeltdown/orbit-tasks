package com.example.gateway.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailSignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 128) String password) {
}
