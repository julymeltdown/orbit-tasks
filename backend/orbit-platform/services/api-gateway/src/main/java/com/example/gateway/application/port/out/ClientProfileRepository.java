package com.example.gateway.application.port.out;

import com.example.gateway.domain.client.ClientProfile;
import java.util.List;
import java.util.Optional;

public interface ClientProfileRepository {
    List<ClientProfile> findAll();

    Optional<ClientProfile> findById(String clientProfileId);

    ClientProfile save(ClientProfile profile);
}
