package com.example.auth.application.port.out;

import com.example.auth.domain.User;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {
    Optional<User> findById(UUID id);

    Optional<User> findByPrimaryEmail(String email);

    User save(User user);
}
