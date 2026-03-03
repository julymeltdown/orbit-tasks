package com.example.auth.application.port.out;

import com.example.auth.domain.PasswordResetToken;
import java.util.Optional;

public interface PasswordResetTokenRepositoryPort {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    Optional<PasswordResetToken> findLatestByEmail(String email);

    PasswordResetToken save(PasswordResetToken token);
}
