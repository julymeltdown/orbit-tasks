package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.LoginAuditEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAuditJpaRepository extends JpaRepository<LoginAuditEntity, UUID> {
}
