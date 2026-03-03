package com.example.post.adapters.out.grpc;

import com.example.post.application.port.out.FriendClientPort;
import com.example.post.application.port.out.NotificationClientPort;
import com.example.post.application.port.out.ProfileClientPort;
import com.example.post.domain.ProfileSnapshot;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
@ConditionalOnProperty(name = "post.grpc.stub.enabled", havingValue = "true", matchIfMissing = true)
public class GrpcStubConfig {
    @Bean
    @Primary
    ProfileClientPort profileClientPort() {
        return userId -> new ProfileSnapshot(userId, "local-user", "", "");
    }

    @Bean
    @Primary
    FriendClientPort friendClientPort() {
        return new FriendClientPort() {
            @Override
            public List<UUID> fetchFollowingIds(UUID userId) {
                return List.of();
            }

            @Override
            public List<UUID> fetchFollowerIds(UUID userId) {
                return List.of();
            }
        };
    }

    @Bean
    @Primary
    NotificationClientPort notificationClientPort() {
        return request -> {
        };
    }
}
