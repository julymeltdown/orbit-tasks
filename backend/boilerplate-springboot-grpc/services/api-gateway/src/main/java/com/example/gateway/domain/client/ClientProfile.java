package com.example.gateway.domain.client;

import java.util.List;

public record ClientProfile(
        String id,
        String clientType,
        List<String> allowedContracts,
        String policySetId
) {
}
