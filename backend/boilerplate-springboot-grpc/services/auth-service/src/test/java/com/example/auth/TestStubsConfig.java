package com.example.auth;

import com.example.auth.application.port.out.RefreshTokenRecord;
import com.example.auth.application.port.out.RefreshTokenStorePort;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestStubsConfig {
    @Bean
    @Primary
    public RefreshTokenStorePort refreshTokenStorePort() {
        return new RefreshTokenStorePort() {
            private final Map<String, RefreshTokenRecord> records = new HashMap<>();

            @Override
            public void store(RefreshTokenRecord record) {
                records.put(record.jti(), record);
            }

            @Override
            public Optional<RefreshTokenRecord> find(String jti) {
                return Optional.ofNullable(records.get(jti));
            }

            @Override
            public boolean rotate(String currentJti, String currentTokenHash, RefreshTokenRecord nextRecord) {
                records.remove(currentJti);
                records.put(nextRecord.jti(), nextRecord);
                return true;
            }

            @Override
            public void revoke(String jti) {
                records.remove(jti);
            }

            @Override
            public boolean isUsed(String jti) {
                return false;
            }
        };
    }
}
