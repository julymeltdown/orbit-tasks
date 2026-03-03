package com.example.auth.adapters.out.persistence;

import com.example.auth.adapters.out.persistence.entity.LoginAuditEntity;
import com.example.auth.application.port.out.LoginAuditRepositoryPort;
import com.example.auth.domain.LoginAudit;
import org.springframework.stereotype.Repository;

@Repository
public class LoginAuditRepositoryAdapter implements LoginAuditRepositoryPort {
    private final LoginAuditJpaRepository repository;

    public LoginAuditRepositoryAdapter(LoginAuditJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public LoginAudit save(LoginAudit audit) {
        LoginAuditEntity saved = repository.save(toEntity(audit));
        return toDomain(saved);
    }

    private static LoginAudit toDomain(LoginAuditEntity entity) {
        return new LoginAudit(
                entity.getId(),
                entity.getUserId(),
                entity.getLoginMethod(),
                entity.getIpAddress(),
                entity.getUserAgent(),
                entity.isSuccess(),
                entity.getOccurredAt());
    }

    private static LoginAuditEntity toEntity(LoginAudit audit) {
        LoginAuditEntity entity = new LoginAuditEntity();
        entity.setId(audit.getId());
        entity.setUserId(audit.getUserId());
        entity.setLoginMethod(audit.getLoginMethod());
        entity.setIpAddress(audit.getIpAddress());
        entity.setUserAgent(audit.getUserAgent());
        entity.setSuccess(audit.isSuccess());
        entity.setOccurredAt(audit.getOccurredAt());
        return entity;
    }
}
