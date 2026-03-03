package com.example.gateway.domain.contract;

import java.time.Instant;

public record RouteContractVersion(
        String version,
        String status,
        Instant deprecationDate,
        String responseSchemaRef
) {
}
