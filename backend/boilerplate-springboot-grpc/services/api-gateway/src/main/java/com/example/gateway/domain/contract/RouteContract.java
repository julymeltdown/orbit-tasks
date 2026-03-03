package com.example.gateway.domain.contract;

import java.util.List;

public record RouteContract(
        String id,
        String routeKey,
        String owner,
        String slaTarget,
        String status,
        List<RouteContractVersion> versions
) {
}
