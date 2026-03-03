package com.example.gateway.application.port.out;

import com.example.gateway.domain.contract.RouteContract;
import com.example.gateway.domain.contract.RouteContractVersion;
import java.util.List;
import java.util.Optional;

public interface RouteContractRepository {
    List<RouteContract> findAll();

    Optional<RouteContract> findById(String contractId);

    Optional<RouteContractVersion> findVersion(String contractId, String version);

    RouteContract save(RouteContract contract);

    RouteContractVersion saveVersion(String contractId, RouteContractVersion version);
}
