package com.example.post.config;

import com.example.post.application.port.out.FeedCachePort;
import com.example.post.application.port.out.PostCachePort;
import com.example.post.application.port.out.PostLikeRepositoryPort;
import com.example.post.application.port.out.PostRepositoryPort;
import com.example.post.domain.Post;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
@ConditionalOnProperty(name = "post.seed.enabled", havingValue = "true")
public class SeedDataConfig {
    @Bean
    CommandLineRunner seedPosts(PostRepositoryPort postRepository,
                                PostLikeRepositoryPort likeRepository,
                                FeedCachePort feedCache,
                                PostCachePort postCache,
                                @Value("${post.seed.reset:true}") boolean reset) {
        return args -> {
            List<Post> posts = seedPosts();
            if (reset) {
                postRepository.clear();
                likeRepository.clear();
                postCache.clear();
                posts.stream()
                        .map(Post::authorId)
                        .distinct()
                        .forEach(feedCache::clear);
            }
            for (Post post : posts) {
                postRepository.save(post);
            }
            seedLikes(postRepository, likeRepository);
        };
    }

    private List<Post> seedPosts() {
        return List.of(
                new Post(
                                        UUID.fromString("11110001-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Rewatching a slice-of-life arc with tea.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110002-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "New key animation book arrived today.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110003-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Trying a pastel color palette for fan art.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110004-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Episode 7 storyboards were wild.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110005-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Late night ramen + opening theme on loop.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110006-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Sketching chibi faces to warm up.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110007-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Background study: rainy alley lights.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110008-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Collected cel frames at a flea market.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("11110009-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Ranking my winter cour favorites.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("1111000a-1111-1111-1111-111111111111"),
                                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                        "Planning a small zine for anime club.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220001-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Scored tonights game pitch by pitch.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220002-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "That slider had absurd movement.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220003-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Spring training schedule is stacked.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220004-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Favorite walk-off moments playlist.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220005-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Keeping scorebook neat is a full workout.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220006-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Bullpen depth looks strong this year.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220007-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Ballpark snacks tier list.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220008-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Studying launch angle charts.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("22220009-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "New glove arrived, ready for catch.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("2222000a-2222-2222-2222-222222222222"),
                                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                        "Rewatching the 9th inning comeback.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330001-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Black Parade on repeat tonight.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330002-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Guitar tone quest continues.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330003-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Setlist dreams for next tour.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330004-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Wrote lyrics in my notes app.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330005-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Learning the Helena intro.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330006-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Red eyeliner and loud amps.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330007-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Bass line practice before work.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330008-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Favorite live video: 2007 show.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("33330009-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "New patch for my denim jacket.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("3333000a-3333-3333-3333-333333333333"),
                                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                                        "Mixing a moody synth layer.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440001-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Ghibli soundtrack while animating clouds.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440002-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Practice: water reflections frame by frame.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440003-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Tiny house concept art on the bus.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440004-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Spirited Away vibes in my color tests.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440005-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Coffee, pencils, and a new layout pass.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440006-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Studying character turns today.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440007-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Storyboard thumbnails for a quiet scene.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440008-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Forest textures with gouache.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("44440009-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Animating a cat jump loop.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("4444000a-4444-4444-4444-444444444444"),
                                        UUID.fromString("44444444-4444-4444-4444-444444444444"),
                                        "Finished a 12-frame walk cycle.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550001-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Drill day: footwork and glove transfers.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550002-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Pitch count limits keep arms healthy.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550003-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Catching pop flies under lights.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550004-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Batting cage focus: inside fastballs.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550005-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Double play reps until sunset.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550006-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Base running reads are improving.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550007-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Scouting report notes updated.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550008-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Favorite stadium: night game vibes.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("55550009-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Long toss at 7am.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("5555000a-5555-5555-5555-555555555555"),
                                        UUID.fromString("55555555-5555-5555-5555-555555555555"),
                                        "Series win calls for extra ramen.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660001-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Three Cheers album mood.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660002-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Found a thrifted band tee.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660003-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Practicing scream-safe warmups.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660004-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Drum fills are everything.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660005-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "New playlist: emo classics.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660006-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Drew a poster for our basement show.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660007-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Amp hum means its time.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660008-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Writing a chorus that hits.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("66660009-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Learning the Welcome to the Black Parade bridge.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("6666000a-6666-6666-6666-666666666666"),
                                        UUID.fromString("66666666-6666-6666-6666-666666666666"),
                                        "Rainy day, loud headphones.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770001-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Speed lines everywhere, training arc vibes.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770002-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Favorite fights ranked, need debate.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770003-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Drew a power-up pose in 5 minutes.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770004-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Practicing dynamic foreshortening.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770005-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "New episode had a perfect sakuga cut.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770006-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Exploring bold ink shading.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770007-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Paneling tips from my mentor.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770008-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Character redesign: lighter armor.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("77770009-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Manga chapter 116 reaction.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("7777000a-7777-7777-7777-777777777777"),
                                        UUID.fromString("77777777-7777-7777-7777-777777777777"),
                                        "Warm-up drills: 30 gesture poses.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880001-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "KBO highlights are pure energy.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880002-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Stadium chants stuck in my head.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880003-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Rain delay snacks and cards.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880004-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Tracking batting averages for fun.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880005-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "New cap arrived in the mail.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880006-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Listening to radio play-by-play.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880007-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Planning a road trip to a rivalry game.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880008-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Scoreboard watching in extra innings.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("88880009-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "My team finally stole home!",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("8888000a-8888-8888-8888-888888888888"),
                                        UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                        "Postgame recap: pitching stole the show.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990001-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Pierce the Veil riffs for breakfast.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990002-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Stage dive dreams, safety first.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990003-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Working on vocal harmonies.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990004-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Merch drop watch party.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990005-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "My pedalboard finally works.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990006-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Tattoo idea: tiny mic and roses.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990007-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Set up for a small venue gig.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990008-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Covering King for a Day tonight.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("99990009-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Metronome at 180 bpm, send help.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("9999000a-9999-9999-9999-999999999999"),
                                        UUID.fromString("99999999-9999-9999-9999-999999999999"),
                                        "Post-show ringing ears, worth it.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Blocking an animation for class critique.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-19T09:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0002-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Rigging notes got messy, but it works.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-18T18:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Lip sync pass number three.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-17T12:40:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Exported my first short as mp4.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-16T08:15:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0005-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Motion study from a baseball swing.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-15T21:05:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0006-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Frame timing sheet updated.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-14T07:50:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0007-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Found a new pencil test workflow.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-13T22:10:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0008-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Polishing clean-up lines tonight.",
                                        "FRIENDS",
                                        Instant.parse("2026-01-12T11:25:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Added subtle eye darts in the scene.",
                                        "PUBLIC",
                                        Instant.parse("2026-01-11T16:55:00Z"),
                                        0
                                ),
                new Post(
                                        UUID.fromString("aaaa000a-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                                        "Render time finally under 10 minutes.",
                                        "PRIVATE",
                                        Instant.parse("2026-01-10T09:45:00Z"),
                                        0
                                )
        );
    }

    private void seedLikes(PostRepositoryPort postRepository, PostLikeRepositoryPort likeRepository) {
        List<UUID> likerIds = List.of(
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                UUID.fromString("33333333-3333-3333-3333-333333333333"),
                UUID.fromString("44444444-4444-4444-4444-444444444444"),
                UUID.fromString("55555555-5555-5555-5555-555555555555"),
                UUID.fromString("66666666-6666-6666-6666-666666666666"),
                UUID.fromString("77777777-7777-7777-7777-777777777777"),
                UUID.fromString("88888888-8888-8888-8888-888888888888"),
                UUID.fromString("99999999-9999-9999-9999-999999999999"),
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        );

        List<UUID> trendingPosts = List.of(
                UUID.fromString("11110001-1111-1111-1111-111111111111"),
                UUID.fromString("22220001-2222-2222-2222-222222222222"),
                UUID.fromString("33330001-3333-3333-3333-333333333333"),
                UUID.fromString("44440001-4444-4444-4444-444444444444"),
                UUID.fromString("55550001-5555-5555-5555-555555555555")
        );

        for (int index = 0; index < trendingPosts.size(); index++) {
            UUID postId = trendingPosts.get(index);
            int likeTarget = Math.max(1, likerIds.size() - index * 2);
            for (int likerIndex = 0; likerIndex < likeTarget; likerIndex++) {
                boolean added = likeRepository.addLike(postId, likerIds.get(likerIndex));
                if (added) {
                    postRepository.adjustLikeCount(postId, 1L);
                }
            }
        }
    }
}
