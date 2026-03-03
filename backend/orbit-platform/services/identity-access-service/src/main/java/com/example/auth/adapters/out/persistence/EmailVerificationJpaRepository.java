package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.EmailVerificationEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationJpaRepository extends JpaRepository<EmailVerificationEntity, UUID> {
    Optional<EmailVerificationEntity> findFirstByEmailOrderByCreatedAtDesc(String email);
}
