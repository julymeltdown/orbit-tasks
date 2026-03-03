package com.example.gateway.adapters.in.web.admin;

import com.example.gateway.application.service.ClientProfileService;
import com.example.gateway.domain.client.ClientProfile;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/clients")
public class ClientProfileAdminController {
    private final ClientProfileService clientProfileService;

    public ClientProfileAdminController(ClientProfileService clientProfileService) {
        this.clientProfileService = clientProfileService;
    }

    @GetMapping
    public List<ClientProfile> listClients() {
        return clientProfileService.listProfiles();
    }

    @GetMapping("/{clientId}")
    public ClientProfile getClient(@PathVariable String clientId) {
        return clientProfileService.getProfile(clientId);
    }

    @PostMapping
    public ResponseEntity<ClientProfile> createClient(@RequestBody ClientProfileRequest request) {
        ClientProfile profile = new ClientProfile(
                null,
                request.clientType(),
                request.allowedContracts(),
                request.policySetId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientProfileService.createProfile(profile));
    }

    public record ClientProfileRequest(
            String clientType,
            List<String> allowedContracts,
            String policySetId
    ) {
    }
}
