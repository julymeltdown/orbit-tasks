package com.example.gateway.adapters.in.web.admin;

import com.example.gateway.application.service.RouteContractService;
import com.example.gateway.domain.contract.RouteContract;
import com.example.gateway.domain.contract.RouteContractVersion;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/contracts")
public class ContractAdminController {
    private final RouteContractService service;

    public ContractAdminController(RouteContractService service) {
        this.service = service;
    }

    @GetMapping
    public List<RouteContract> listContracts() {
        return service.listContracts();
    }

    @PostMapping
    public ResponseEntity<RouteContract> createContract(@RequestBody RouteContractCreateRequest request) {
        RouteContract contract = new RouteContract(
                null,
                request.routeKey(),
                request.owner(),
                request.slaTarget(),
                defaultStatus(request.status(), "draft"),
                List.of());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createContract(contract));
    }

    @GetMapping("/{contractId}")
    public RouteContract getContract(@PathVariable String contractId) {
        return service.getContract(contractId);
    }

    @GetMapping("/{contractId}/versions")
    public List<RouteContractVersion> listVersions(@PathVariable String contractId) {
        return service.getContract(contractId).versions();
    }

    @PostMapping("/{contractId}/versions")
    public ResponseEntity<RouteContractVersion> createVersion(
            @PathVariable String contractId,
            @RequestBody RouteContractVersionCreateRequest request) {
        RouteContractVersion version = new RouteContractVersion(
                request.version(),
                defaultStatus(request.status(), "active"),
                request.deprecationDate(),
                request.responseSchemaRef());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createVersion(contractId, version));
    }

    @GetMapping("/{contractId}/versions/{version}")
    public RouteContractVersion getVersion(
            @PathVariable String contractId,
            @PathVariable String version) {
        return service.getVersion(contractId, version);
    }

    @PatchMapping("/{contractId}/versions/{version}")
    public RouteContractVersion updateVersion(
            @PathVariable String contractId,
            @PathVariable String version,
            @RequestBody RouteContractVersionUpdateRequest request) {
        RouteContractVersion existing = service.getVersion(contractId, version);
        RouteContractVersion updated = new RouteContractVersion(
                existing.version(),
                defaultStatus(request.status(), existing.status()),
                request.deprecationDate() != null ? request.deprecationDate() : existing.deprecationDate(),
                existing.responseSchemaRef());
        return service.createVersion(contractId, updated);
    }

    private String defaultStatus(String value, String fallback) {
        return Optional.ofNullable(value).filter(item -> !item.isBlank()).orElse(fallback);
    }

    public record RouteContractCreateRequest(
            String routeKey,
            String owner,
            String slaTarget,
            String status
    ) {
    }

    public record RouteContractVersionCreateRequest(
            String version,
            String responseSchemaRef,
            String status,
            Instant deprecationDate
    ) {
    }

    public record RouteContractVersionUpdateRequest(
            String status,
            Instant deprecationDate
    ) {
    }
}
