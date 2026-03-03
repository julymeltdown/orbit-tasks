package com.example.gateway.application.service;

import com.example.gateway.application.port.out.RouteContractRepository;
import com.example.gateway.domain.contract.RouteContract;
import com.example.gateway.domain.contract.RouteContractVersion;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RouteContractService {
    private final RouteContractRepository repository;

    public RouteContractService(RouteContractRepository repository) {
        this.repository = repository;
    }

    public List<RouteContract> listContracts() {
        return repository.findAll();
    }

    public RouteContract getContract(String contractId) {
        return repository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Route contract not found: " + contractId));
    }

    public RouteContractVersion getVersion(String contractId, String version) {
        return repository.findVersion(contractId, version)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Route contract version not found: " + contractId + ":" + version));
    }

    public RouteContract createContract(RouteContract contract) {
        return repository.save(contract);
    }

    public RouteContractVersion createVersion(String contractId, RouteContractVersion version) {
        return repository.saveVersion(contractId, version);
    }
}
