package com.example.friend.config;

import com.example.friend.adapters.in.grpc.FriendGrpcService;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
@ConditionalOnProperty(name = "friend.seed.enabled", havingValue = "true")
public class SeedDataConfig {
    @Bean
    CommandLineRunner seedFriends(FriendGrpcService friendGrpcService,
                                  @Value("${friend.seed.reset:true}") boolean reset) {
        return args -> {
            if (reset) {
                friendGrpcService.clear();
            }
            for (String[] pair : seedPairs()) {
                friendGrpcService.seedFollow(pair[0], pair[1]);
            }
        };
    }

    private List<String[]> seedPairs() {
        return List.of(
                new String[]{"11111111-1111-1111-1111-111111111111", "44444444-4444-4444-4444-444444444444"},
                new String[]{"44444444-4444-4444-4444-444444444444", "77777777-7777-7777-7777-777777777777"},
                new String[]{"77777777-7777-7777-7777-777777777777", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"},
                new String[]{"11111111-1111-1111-1111-111111111111", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"},
                new String[]{"11111111-1111-1111-1111-111111111111", "77777777-7777-7777-7777-777777777777"},
                new String[]{"22222222-2222-2222-2222-222222222222", "55555555-5555-5555-5555-555555555555"},
                new String[]{"55555555-5555-5555-5555-555555555555", "88888888-8888-8888-8888-888888888888"},
                new String[]{"22222222-2222-2222-2222-222222222222", "88888888-8888-8888-8888-888888888888"},
                new String[]{"33333333-3333-3333-3333-333333333333", "66666666-6666-6666-6666-666666666666"},
                new String[]{"66666666-6666-6666-6666-666666666666", "99999999-9999-9999-9999-999999999999"},
                new String[]{"33333333-3333-3333-3333-333333333333", "99999999-9999-9999-9999-999999999999"},
                new String[]{"11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"},
                new String[]{"44444444-4444-4444-4444-444444444444", "33333333-3333-3333-3333-333333333333"},
                new String[]{"77777777-7777-7777-7777-777777777777", "66666666-6666-6666-6666-666666666666"},
                new String[]{"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "88888888-8888-8888-8888-888888888888"},
                new String[]{"55555555-5555-5555-5555-555555555555", "99999999-9999-9999-9999-999999999999"}
        );
    }
}
