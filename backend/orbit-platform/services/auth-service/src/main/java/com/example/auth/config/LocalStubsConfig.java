package com.example.auth.config;

import com.example.auth.application.port.out.EmailSenderPort;
import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
public class LocalStubsConfig {
    @Bean
    @Primary
    @ConditionalOnProperty(name = "auth.email.stub", havingValue = "true", matchIfMissing = true)
    EmailSenderPort emailSenderPort() {
        return new EmailSenderPort() {
            @Override
            public void sendVerificationCode(String email, String code) {
            }

            @Override
            public void sendPasswordResetLink(String email, String link) {
            }
        };
    }

    @Bean
    @Primary
    RefreshTokenStorePort refreshTokenStorePort() {
        return new InMemoryRefreshTokenStore();
    }

    static class InMemoryRefreshTokenStore implements RefreshTokenStorePort {
        private final ConcurrentHashMap<String, RefreshTokenRecord> records = new ConcurrentHashMap<>();
        private final Set<String> usedTokens = ConcurrentHashMap.newKeySet();

        @Override
        public void store(RefreshTokenRecord record) {
            records.put(record.jti(), record);
        }

        @Override
        public Optional<RefreshTokenRecord> find(String jti) {
            RefreshTokenRecord record = records.get(jti);
            if (record == null) {
                return Optional.empty();
            }
            if (record.expiresAt().isBefore(Instant.now())) {
                records.remove(jti);
                return Optional.empty();
            }
            return Optional.of(record);
        }

        @Override
        public boolean rotate(String currentJti, String currentTokenHash, RefreshTokenRecord nextRecord) {
            RefreshTokenRecord existing = records.get(currentJti);
            if (existing == null || usedTokens.contains(currentJti)) {
                return false;
            }
            if (!existing.tokenHash().equals(currentTokenHash)) {
                return false;
            }
            records.remove(currentJti);
            usedTokens.add(currentJti);
            records.put(nextRecord.jti(), nextRecord);
            return true;
        }

        @Override
        public void revoke(String jti) {
            records.remove(jti);
            usedTokens.remove(jti);
        }

        @Override
        public boolean isUsed(String jti) {
            return usedTokens.contains(jti);
        }
    }
}
