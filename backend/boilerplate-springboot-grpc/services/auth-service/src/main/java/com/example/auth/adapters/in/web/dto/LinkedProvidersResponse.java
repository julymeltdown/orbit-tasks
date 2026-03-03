package com.example.auth.adapters.in.web.dto;

import com.example.auth.domain.IdentityProvider;
import java.util.List;
import java.util.UUID;

public record LinkedProvidersResponse(UUID userId, List<IdentityProvider> linkedProviders) {
}
