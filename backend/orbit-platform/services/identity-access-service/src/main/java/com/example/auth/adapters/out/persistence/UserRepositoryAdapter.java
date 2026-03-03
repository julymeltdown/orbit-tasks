package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.UserEntity;
import com.example.auth.application.port.out.UserRepositoryPort;
import com.example.auth.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepositoryAdapter implements UserRepositoryPort {
    private final UserJpaRepository repository;

    public UserRepositoryAdapter(UserJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id).map(UserRepositoryAdapter::toDomain);
    }

    @Override
    public Optional<User> findByPrimaryEmail(String email) {
        return repository.findByPrimaryEmail(email).map(UserRepositoryAdapter::toDomain);
    }

    @Override
    public User save(User user) {
        UserEntity entity = toEntity(user);
        UserEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    private static User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getPrimaryEmail(),
                entity.getPasswordHash(),
                entity.getStatus(),
                entity.getLastLoginAt());
    }

    private static UserEntity toEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setPrimaryEmail(user.getPrimaryEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setStatus(user.getStatus());
        entity.setLastLoginAt(user.getLastLoginAt());
        return entity;
    }
}
