package com.example.auth.adapters.out.persistence.entity;

import com.example.auth.domain.IdentityProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_identities",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_identity_provider_subject",
                        columnNames = {"provider_type", "provider_subject"}),
                @UniqueConstraint(name = "uk_user_identity_provider_email",
                        columnNames = {"provider_type", "email"})
        })
public class UserIdentityEntity extends BaseAuditEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false)
    private IdentityProvider providerType;

    @Column(name = "provider_subject")
    private String providerSubject;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "linked_at")
    private Instant linkedAt;

    public UserIdentityEntity() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public IdentityProvider getProviderType() {
        return providerType;
    }

    public void setProviderType(IdentityProvider providerType) {
        this.providerType = providerType;
    }

    public String getProviderSubject() {
        return providerSubject;
    }

    public void setProviderSubject(String providerSubject) {
        this.providerSubject = providerSubject;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(Instant linkedAt) {
        this.linkedAt = linkedAt;
    }
}
