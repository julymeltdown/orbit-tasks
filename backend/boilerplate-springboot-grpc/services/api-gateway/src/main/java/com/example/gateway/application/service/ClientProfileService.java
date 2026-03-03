package com.example.gateway.application.service;

import com.example.gateway.application.port.out.ClientProfileRepository;
import com.example.gateway.domain.client.ClientProfile;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ClientProfileService {
    private final ClientProfileRepository repository;

    public ClientProfileService(ClientProfileRepository repository) {
        this.repository = repository;
    }

    public List<ClientProfile> listProfiles() {
        return repository.findAll();
    }

    public ClientProfile getProfile(String profileId) {
        return repository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Client profile not found: " + profileId));
    }

    public ClientProfile createProfile(ClientProfile profile) {
        return repository.save(profile);
    }
}
