package com.example.profile.config;

import com.example.profile.application.port.out.AvatarRepositoryPort;
import com.example.profile.application.port.out.ProfileRepositoryPort;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
@ConditionalOnProperty(name = "profile.seed.enabled", havingValue = "true")
public class SeedDataConfig {
    @Bean
    CommandLineRunner seedProfiles(ProfileRepositoryPort profileRepository,
                                   AvatarRepositoryPort avatarRepository,
                                   @Value("${profile.seed.reset:true}") boolean reset) {
        return args -> {
            if (reset) {
                profileRepository.clear();
                avatarRepository.clear();
            }
            for (SeedProfile profile : seedProfiles()) {
                profileRepository.save(new com.example.profile.domain.Profile(
                        profile.userId(),
                        profile.username(),
                        profile.nickname(),
                        profile.avatarUrl(),
                        profile.bio(),
                        profile.followerCount(),
                        profile.followingCount(),
                        profile.postCount()
                ));
            }
        };
    }

    private List<SeedProfile> seedProfiles() {
        return List.of(
                new SeedProfile(
                        "11111111-1111-1111-1111-111111111111",
                        "hana_ani",
                        "Hana Akiyama",
                        "/avatars/cat.svg",
                        "Anime cafe nights, storyboard notes, and soft color palettes.",
                        0,
                        4,
                        10
                ),
                new SeedProfile(
                        "22222222-2222-2222-2222-222222222222",
                        "jin_slugg",
                        "Jin Park",
                        "/avatars/fox.svg",
                        "Baseball stats, bullpen chatter, and scorebook ink.",
                        1,
                        2,
                        10
                ),
                new SeedProfile(
                        "33333333-3333-3333-3333-333333333333",
                        "soyeon_emo",
                        "Soyeon Lee",
                        "/avatars/owl.svg",
                        "MCR forever. Guitars, eyeliner, and loud choruses.",
                        1,
                        2,
                        10
                ),
                new SeedProfile(
                        "44444444-4444-4444-4444-444444444444",
                        "mira_ghibli",
                        "Mira Han",
                        "/avatars/dog.svg",
                        "Ghibli skies, pencil dust, and quiet story beats.",
                        1,
                        2,
                        10
                ),
                new SeedProfile(
                        "55555555-5555-5555-5555-555555555555",
                        "tae_dingers",
                        "Tae Kim",
                        "/avatars/bear.svg",
                        "Cage work, long toss, and night game energy.",
                        1,
                        2,
                        10
                ),
                new SeedProfile(
                        "66666666-6666-6666-6666-666666666666",
                        "minji_blackparade",
                        "Minji Seo",
                        "/avatars/rabbit.svg",
                        "Black Parade mood. Writing hooks and chasing tone.",
                        2,
                        1,
                        10
                ),
                new SeedProfile(
                        "77777777-7777-7777-7777-777777777777",
                        "ryu_shonen",
                        "Ryu Tanaka",
                        "/avatars/tiger.svg",
                        "Shonen panels, speed lines, and training arcs.",
                        2,
                        2,
                        10
                ),
                new SeedProfile(
                        "88888888-8888-8888-8888-888888888888",
                        "eun_base",
                        "Eun Choi",
                        "/avatars/panda.svg",
                        "KBO chants, caps, and extra innings recaps.",
                        3,
                        0,
                        10
                ),
                new SeedProfile(
                        "99999999-9999-9999-9999-999999999999",
                        "lexi_pierce",
                        "Lexi Moon",
                        "/avatars/koala.svg",
                        "Pierce the Veil fan. Loud riffs and late gigs.",
                        3,
                        0,
                        10
                ),
                new SeedProfile(
                        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "noa_animator",
                        "Noa Kim",
                        "/avatars/whale.svg",
                        "Animation student. Timing charts and clean-up passes.",
                        2,
                        1,
                        10
                )
        );
    }

    private record SeedProfile(
            String userId,
            String username,
            String nickname,
            String avatarUrl,
            String bio,
            long followerCount,
            long followingCount,
            long postCount
    ) {
    }
}
