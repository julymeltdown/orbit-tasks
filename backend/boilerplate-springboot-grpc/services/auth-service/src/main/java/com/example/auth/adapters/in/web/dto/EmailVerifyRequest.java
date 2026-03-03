package com.example.auth.adapters.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailVerifyRequest(
        @NotBlank @Email String email,
        @NotBlank String code) {
}
