package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByPrimaryEmail(String primaryEmail);
}
