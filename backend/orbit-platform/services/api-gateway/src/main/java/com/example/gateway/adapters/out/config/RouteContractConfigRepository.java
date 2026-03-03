package com.example.gateway.adapters.out.config;

import com.example.gateway.application.port.out.RouteContractRepository;
import com.example.gateway.config.GatewayGovernanceProperties;
import com.example.gateway.domain.contract.RouteContract;
import com.example.gateway.domain.contract.RouteContractVersion;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class RouteContractConfigRepository implements RouteContractRepository {
    private final Map<String, RouteContract> contracts = new ConcurrentHashMap<>();

    public RouteContractConfigRepository(GatewayGovernanceProperties properties) {
        loadFromConfig(properties);
    }

    @Override
    public List<RouteContract> findAll() {
        return List.copyOf(contracts.values());
    }

    @Override
    public Optional<RouteContract> findById(String contractId) {
        return Optional.ofNullable(contracts.get(contractId));
    }

    @Override
    public Optional<RouteContractVersion> findVersion(String contractId, String version) {
        return findById(contractId)
                .flatMap(contract -> contract.versions().stream()
                        .filter(item -> item.version().equals(version))
                        .findFirst());
    }

    @Override
    public RouteContract save(RouteContract contract) {
        String id = (contract.id() == null || contract.id().isBlank())
                ? UUID.randomUUID().toString()
                : contract.id();
        RouteContract updated = new RouteContract(
                id,
                contract.routeKey(),
                contract.owner(),
                contract.slaTarget(),
                contract.status(),
                contract.versions());
        contracts.put(id, updated);
        return updated;
    }

    @Override
    public RouteContractVersion saveVersion(String contractId, RouteContractVersion version) {
        RouteContract contract = contracts.get(contractId);
        if (contract == null) {
            throw new IllegalArgumentException("Route contract not found: " + contractId);
        }
        List<RouteContractVersion> versions = new ArrayList<>(contract.versions());
        versions.removeIf(item -> item.version().equals(version.version()));
        versions.add(version);
        RouteContract updated = new RouteContract(
                contract.id(),
                contract.routeKey(),
                contract.owner(),
                contract.slaTarget(),
                contract.status(),
                List.copyOf(versions));
        contracts.put(contractId, updated);
        return version;
    }

    private void loadFromConfig(GatewayGovernanceProperties properties) {
        for (GatewayGovernanceProperties.RouteContractDefinition definition : properties.getContracts()) {
            String id = (definition.getId() == null || definition.getId().isBlank())
                    ? UUID.randomUUID().toString()
                    : definition.getId();
            List<RouteContractVersion> versions = definition.getVersions().stream()
                    .map(item -> new RouteContractVersion(
                            item.getVersion(),
                            item.getStatus(),
                            item.getDeprecationDate(),
                            item.getResponseSchemaRef()))
                    .toList();
            RouteContract contract = new RouteContract(
                    id,
                    definition.getRouteKey(),
                    definition.getOwner(),
                    definition.getSlaTarget(),
                    definition.getStatus(),
                    versions);
            contracts.put(id, contract);
        }
    }
}
