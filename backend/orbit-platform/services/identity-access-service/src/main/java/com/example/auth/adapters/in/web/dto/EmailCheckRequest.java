package com.example.auth.adapters.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailCheckRequest(
        @NotBlank @Email String email
) {
}
