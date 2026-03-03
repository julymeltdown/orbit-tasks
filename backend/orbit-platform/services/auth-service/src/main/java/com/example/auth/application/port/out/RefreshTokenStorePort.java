package com.example.auth.application.port.out;

import java.util.Optional;

public interface RefreshTokenStorePort {
    void store(RefreshTokenRecord record);

    Optional<RefreshTokenRecord> find(String jti);

    boolean rotate(String currentJti, String currentTokenHash, RefreshTokenRecord nextRecord);

    void revoke(String jti);

    boolean isUsed(String jti);
}
