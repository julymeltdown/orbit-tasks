package com.example.gateway.application.dto;

import com.example.gateway.domain.IdentityProvider;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

public record LinkedProvidersResponse(
        UUID userId,
        @JsonProperty("providers")
        @JsonAlias("linkedProviders")
        List<IdentityProvider> providers) {
}
