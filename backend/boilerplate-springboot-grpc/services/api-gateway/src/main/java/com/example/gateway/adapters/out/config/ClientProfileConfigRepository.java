package com.example.gateway.adapters.out.config;

import com.example.gateway.application.port.out.ClientProfileRepository;
import com.example.gateway.config.GatewayGovernanceProperties;
import com.example.gateway.domain.client.ClientProfile;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ClientProfileConfigRepository implements ClientProfileRepository {
    private final Map<String, ClientProfile> profiles = new ConcurrentHashMap<>();

    public ClientProfileConfigRepository(GatewayGovernanceProperties properties) {
        loadFromConfig(properties);
    }

    @Override
    public List<ClientProfile> findAll() {
        return List.copyOf(profiles.values());
    }

    @Override
    public Optional<ClientProfile> findById(String clientProfileId) {
        return Optional.ofNullable(profiles.get(clientProfileId));
    }

    @Override
    public ClientProfile save(ClientProfile profile) {
        String id = (profile.id() == null || profile.id().isBlank())
                ? UUID.randomUUID().toString()
                : profile.id();
        ClientProfile updated = new ClientProfile(
                id,
                profile.clientType(),
                profile.allowedContracts(),
                profile.policySetId());
        profiles.put(id, updated);
        return updated;
    }

    private void loadFromConfig(GatewayGovernanceProperties properties) {
        for (GatewayGovernanceProperties.ClientProfileDefinition definition : properties.getClientProfiles()) {
            String id = (definition.getId() == null || definition.getId().isBlank())
                    ? UUID.randomUUID().toString()
                    : definition.getId();
            ClientProfile profile = new ClientProfile(
                    id,
                    definition.getClientType(),
                    definition.getAllowedContracts(),
                    definition.getPolicySetId());
            profiles.put(id, profile);
        }
    }
}
