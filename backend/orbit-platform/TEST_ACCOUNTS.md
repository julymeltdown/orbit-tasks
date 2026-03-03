# Test Accounts (Seeded)

These accounts are seeded when running with local profile and the seed flags enabled
(e.g., `AUTH_SEED_ENABLED=true`, `PROFILE_SEED_ENABLED=true`, `FRIEND_SEED_ENABLED=true`,
`POST_SEED_ENABLED=true`). Resets are controlled by the corresponding `*_SEED_RESET` flags.

Password (all accounts): `Passw0rd!`

## Accounts

1) Hana Akiyama
- userId: `11111111-1111-1111-1111-111111111111`
- email: `hana@example.com`
- username: `hana_ani`
- displayName: `Hana Akiyama`
- avatarUrl: `/avatars/cat.svg`
- bio: `Anime cafe nights, storyboard notes, and soft color palettes.`
- theme: `Anime`

2) Jin Park
- userId: `22222222-2222-2222-2222-222222222222`
- email: `jin@example.com`
- username: `jin_slugg`
- displayName: `Jin Park`
- avatarUrl: `/avatars/fox.svg`
- bio: `Baseball stats, bullpen chatter, and scorebook ink.`
- theme: `Baseball`

3) Soyeon Lee
- userId: `33333333-3333-3333-3333-333333333333`
- email: `soyeon@example.com`
- username: `soyeon_emo`
- displayName: `Soyeon Lee`
- avatarUrl: `/avatars/owl.svg`
- bio: `MCR forever. Guitars, eyeliner, and loud choruses.`
- theme: `Emo rock`

4) Mira Han
- userId: `44444444-4444-4444-4444-444444444444`
- email: `mira@example.com`
- username: `mira_ghibli`
- displayName: `Mira Han`
- avatarUrl: `/avatars/dog.svg`
- bio: `Ghibli skies, pencil dust, and quiet story beats.`
- theme: `Animation (Ghibli)`

5) Tae Kim
- userId: `55555555-5555-5555-5555-555555555555`
- email: `tae@example.com`
- username: `tae_dingers`
- displayName: `Tae Kim`
- avatarUrl: `/avatars/bear.svg`
- bio: `Cage work, long toss, and night game energy.`
- theme: `Baseball`

6) Minji Seo
- userId: `66666666-6666-6666-6666-666666666666`
- email: `minji@example.com`
- username: `minji_blackparade`
- displayName: `Minji Seo`
- avatarUrl: `/avatars/rabbit.svg`
- bio: `Black Parade mood. Writing hooks and chasing tone.`
- theme: `Emo rock`

7) Ryu Tanaka
- userId: `77777777-7777-7777-7777-777777777777`
- email: `ryu@example.com`
- username: `ryu_shonen`
- displayName: `Ryu Tanaka`
- avatarUrl: `/avatars/tiger.svg`
- bio: `Shonen panels, speed lines, and training arcs.`
- theme: `Anime (Shonen)`

8) Eun Choi
- userId: `88888888-8888-8888-8888-888888888888`
- email: `eun@example.com`
- username: `eun_base`
- displayName: `Eun Choi`
- avatarUrl: `/avatars/panda.svg`
- bio: `KBO chants, caps, and extra innings recaps.`
- theme: `Baseball`

9) Lexi Moon
- userId: `99999999-9999-9999-9999-999999999999`
- email: `lexi@example.com`
- username: `lexi_pierce`
- displayName: `Lexi Moon`
- avatarUrl: `/avatars/koala.svg`
- bio: `Pierce the Veil fan. Loud riffs and late gigs.`
- theme: `Emo rock (Pierce the Veil)`

10) Noa Kim
- userId: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- email: `noa@example.com`
- username: `noa_animator`
- displayName: `Noa Kim`
- avatarUrl: `/avatars/whale.svg`
- bio: `Animation student. Timing charts and clean-up passes.`
- theme: `Animation`

## Follow Graph (Follower -> Followee)

- 11111111-1111-1111-1111-111111111111 -> 44444444-4444-4444-4444-444444444444
- 44444444-4444-4444-4444-444444444444 -> 77777777-7777-7777-7777-777777777777
- 77777777-7777-7777-7777-777777777777 -> aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
- 11111111-1111-1111-1111-111111111111 -> aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
- 11111111-1111-1111-1111-111111111111 -> 77777777-7777-7777-7777-777777777777
- 22222222-2222-2222-2222-222222222222 -> 55555555-5555-5555-5555-555555555555
- 55555555-5555-5555-5555-555555555555 -> 88888888-8888-8888-8888-888888888888
- 22222222-2222-2222-2222-222222222222 -> 88888888-8888-8888-8888-888888888888
- 33333333-3333-3333-3333-333333333333 -> 66666666-6666-6666-6666-666666666666
- 66666666-6666-6666-6666-666666666666 -> 99999999-9999-9999-9999-999999999999
- 33333333-3333-3333-3333-333333333333 -> 99999999-9999-9999-9999-999999999999
- 11111111-1111-1111-1111-111111111111 -> 22222222-2222-2222-2222-222222222222
- 44444444-4444-4444-4444-444444444444 -> 33333333-3333-3333-3333-333333333333
- 77777777-7777-7777-7777-777777777777 -> 66666666-6666-6666-6666-666666666666
- aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa -> 88888888-8888-8888-8888-888888888888
- 55555555-5555-5555-5555-555555555555 -> 99999999-9999-9999-9999-999999999999

## Seeded Posts

### Hana Akiyama (hana_ani)
- `11110001-1111-1111-1111-111111111111` (PUBLIC) "Rewatching a slice-of-life arc with tea." @ 2026-01-19T09:10:00Z
- `11110002-1111-1111-1111-111111111111` (PUBLIC) "New key animation book arrived today." @ 2026-01-18T18:25:00Z
- `11110003-1111-1111-1111-111111111111` (PUBLIC) "Trying a pastel color palette for fan art." @ 2026-01-17T12:40:00Z
- `11110004-1111-1111-1111-111111111111` (PUBLIC) "Episode 7 storyboards were wild." @ 2026-01-16T08:15:00Z
- `11110005-1111-1111-1111-111111111111` (PUBLIC) "Late night ramen + opening theme on loop." @ 2026-01-15T21:05:00Z
- `11110006-1111-1111-1111-111111111111` (PUBLIC) "Sketching chibi faces to warm up." @ 2026-01-14T07:50:00Z
- `11110007-1111-1111-1111-111111111111` (PUBLIC) "Background study: rainy alley lights." @ 2026-01-13T22:10:00Z
- `11110008-1111-1111-1111-111111111111` (FRIENDS) "Collected cel frames at a flea market." @ 2026-01-12T11:25:00Z
- `11110009-1111-1111-1111-111111111111` (PUBLIC) "Ranking my winter cour favorites." @ 2026-01-11T16:55:00Z
- `1111000a-1111-1111-1111-111111111111` (PRIVATE) "Planning a small zine for anime club." @ 2026-01-10T09:45:00Z

### Jin Park (jin_slugg)
- `22220001-2222-2222-2222-222222222222` (PUBLIC) "Scored tonights game pitch by pitch." @ 2026-01-19T09:10:00Z
- `22220002-2222-2222-2222-222222222222` (PUBLIC) "That slider had absurd movement." @ 2026-01-18T18:25:00Z
- `22220003-2222-2222-2222-222222222222` (PUBLIC) "Spring training schedule is stacked." @ 2026-01-17T12:40:00Z
- `22220004-2222-2222-2222-222222222222` (PUBLIC) "Favorite walk-off moments playlist." @ 2026-01-16T08:15:00Z
- `22220005-2222-2222-2222-222222222222` (PUBLIC) "Keeping scorebook neat is a full workout." @ 2026-01-15T21:05:00Z
- `22220006-2222-2222-2222-222222222222` (PUBLIC) "Bullpen depth looks strong this year." @ 2026-01-14T07:50:00Z
- `22220007-2222-2222-2222-222222222222` (PUBLIC) "Ballpark snacks tier list." @ 2026-01-13T22:10:00Z
- `22220008-2222-2222-2222-222222222222` (FRIENDS) "Studying launch angle charts." @ 2026-01-12T11:25:00Z
- `22220009-2222-2222-2222-222222222222` (PUBLIC) "New glove arrived, ready for catch." @ 2026-01-11T16:55:00Z
- `2222000a-2222-2222-2222-222222222222` (PRIVATE) "Rewatching the 9th inning comeback." @ 2026-01-10T09:45:00Z

### Soyeon Lee (soyeon_emo)
- `33330001-3333-3333-3333-333333333333` (PUBLIC) "Black Parade on repeat tonight." @ 2026-01-19T09:10:00Z
- `33330002-3333-3333-3333-333333333333` (PUBLIC) "Guitar tone quest continues." @ 2026-01-18T18:25:00Z
- `33330003-3333-3333-3333-333333333333` (PUBLIC) "Setlist dreams for next tour." @ 2026-01-17T12:40:00Z
- `33330004-3333-3333-3333-333333333333` (PUBLIC) "Wrote lyrics in my notes app." @ 2026-01-16T08:15:00Z
- `33330005-3333-3333-3333-333333333333` (PUBLIC) "Learning the Helena intro." @ 2026-01-15T21:05:00Z
- `33330006-3333-3333-3333-333333333333` (PUBLIC) "Red eyeliner and loud amps." @ 2026-01-14T07:50:00Z
- `33330007-3333-3333-3333-333333333333` (PUBLIC) "Bass line practice before work." @ 2026-01-13T22:10:00Z
- `33330008-3333-3333-3333-333333333333` (FRIENDS) "Favorite live video: 2007 show." @ 2026-01-12T11:25:00Z
- `33330009-3333-3333-3333-333333333333` (PUBLIC) "New patch for my denim jacket." @ 2026-01-11T16:55:00Z
- `3333000a-3333-3333-3333-333333333333` (PRIVATE) "Mixing a moody synth layer." @ 2026-01-10T09:45:00Z

### Mira Han (mira_ghibli)
- `44440001-4444-4444-4444-444444444444` (PUBLIC) "Ghibli soundtrack while animating clouds." @ 2026-01-19T09:10:00Z
- `44440002-4444-4444-4444-444444444444` (PUBLIC) "Practice: water reflections frame by frame." @ 2026-01-18T18:25:00Z
- `44440003-4444-4444-4444-444444444444` (PUBLIC) "Tiny house concept art on the bus." @ 2026-01-17T12:40:00Z
- `44440004-4444-4444-4444-444444444444` (PUBLIC) "Spirited Away vibes in my color tests." @ 2026-01-16T08:15:00Z
- `44440005-4444-4444-4444-444444444444` (PUBLIC) "Coffee, pencils, and a new layout pass." @ 2026-01-15T21:05:00Z
- `44440006-4444-4444-4444-444444444444` (PUBLIC) "Studying character turns today." @ 2026-01-14T07:50:00Z
- `44440007-4444-4444-4444-444444444444` (PUBLIC) "Storyboard thumbnails for a quiet scene." @ 2026-01-13T22:10:00Z
- `44440008-4444-4444-4444-444444444444` (FRIENDS) "Forest textures with gouache." @ 2026-01-12T11:25:00Z
- `44440009-4444-4444-4444-444444444444` (PUBLIC) "Animating a cat jump loop." @ 2026-01-11T16:55:00Z
- `4444000a-4444-4444-4444-444444444444` (PRIVATE) "Finished a 12-frame walk cycle." @ 2026-01-10T09:45:00Z

### Tae Kim (tae_dingers)
- `55550001-5555-5555-5555-555555555555` (PUBLIC) "Drill day: footwork and glove transfers." @ 2026-01-19T09:10:00Z
- `55550002-5555-5555-5555-555555555555` (PUBLIC) "Pitch count limits keep arms healthy." @ 2026-01-18T18:25:00Z
- `55550003-5555-5555-5555-555555555555` (PUBLIC) "Catching pop flies under lights." @ 2026-01-17T12:40:00Z
- `55550004-5555-5555-5555-555555555555` (PUBLIC) "Batting cage focus: inside fastballs." @ 2026-01-16T08:15:00Z
- `55550005-5555-5555-5555-555555555555` (PUBLIC) "Double play reps until sunset." @ 2026-01-15T21:05:00Z
- `55550006-5555-5555-5555-555555555555` (PUBLIC) "Base running reads are improving." @ 2026-01-14T07:50:00Z
- `55550007-5555-5555-5555-555555555555` (PUBLIC) "Scouting report notes updated." @ 2026-01-13T22:10:00Z
- `55550008-5555-5555-5555-555555555555` (FRIENDS) "Favorite stadium: night game vibes." @ 2026-01-12T11:25:00Z
- `55550009-5555-5555-5555-555555555555` (PUBLIC) "Long toss at 7am." @ 2026-01-11T16:55:00Z
- `5555000a-5555-5555-5555-555555555555` (PRIVATE) "Series win calls for extra ramen." @ 2026-01-10T09:45:00Z

### Minji Seo (minji_blackparade)
- `66660001-6666-6666-6666-666666666666` (PUBLIC) "Three Cheers album mood." @ 2026-01-19T09:10:00Z
- `66660002-6666-6666-6666-666666666666` (PUBLIC) "Found a thrifted band tee." @ 2026-01-18T18:25:00Z
- `66660003-6666-6666-6666-666666666666` (PUBLIC) "Practicing scream-safe warmups." @ 2026-01-17T12:40:00Z
- `66660004-6666-6666-6666-666666666666` (PUBLIC) "Drum fills are everything." @ 2026-01-16T08:15:00Z
- `66660005-6666-6666-6666-666666666666` (PUBLIC) "New playlist: emo classics." @ 2026-01-15T21:05:00Z
- `66660006-6666-6666-6666-666666666666` (PUBLIC) "Drew a poster for our basement show." @ 2026-01-14T07:50:00Z
- `66660007-6666-6666-6666-666666666666` (PUBLIC) "Amp hum means its time." @ 2026-01-13T22:10:00Z
- `66660008-6666-6666-6666-666666666666` (FRIENDS) "Writing a chorus that hits." @ 2026-01-12T11:25:00Z
- `66660009-6666-6666-6666-666666666666` (PUBLIC) "Learning the Welcome to the Black Parade bridge." @ 2026-01-11T16:55:00Z
- `6666000a-6666-6666-6666-666666666666` (PRIVATE) "Rainy day, loud headphones." @ 2026-01-10T09:45:00Z

### Ryu Tanaka (ryu_shonen)
- `77770001-7777-7777-7777-777777777777` (PUBLIC) "Speed lines everywhere, training arc vibes." @ 2026-01-19T09:10:00Z
- `77770002-7777-7777-7777-777777777777` (PUBLIC) "Favorite fights ranked, need debate." @ 2026-01-18T18:25:00Z
- `77770003-7777-7777-7777-777777777777` (PUBLIC) "Drew a power-up pose in 5 minutes." @ 2026-01-17T12:40:00Z
- `77770004-7777-7777-7777-777777777777` (PUBLIC) "Practicing dynamic foreshortening." @ 2026-01-16T08:15:00Z
- `77770005-7777-7777-7777-777777777777` (PUBLIC) "New episode had a perfect sakuga cut." @ 2026-01-15T21:05:00Z
- `77770006-7777-7777-7777-777777777777` (PUBLIC) "Exploring bold ink shading." @ 2026-01-14T07:50:00Z
- `77770007-7777-7777-7777-777777777777` (PUBLIC) "Paneling tips from my mentor." @ 2026-01-13T22:10:00Z
- `77770008-7777-7777-7777-777777777777` (FRIENDS) "Character redesign: lighter armor." @ 2026-01-12T11:25:00Z
- `77770009-7777-7777-7777-777777777777` (PUBLIC) "Manga chapter 116 reaction." @ 2026-01-11T16:55:00Z
- `7777000a-7777-7777-7777-777777777777` (PRIVATE) "Warm-up drills: 30 gesture poses." @ 2026-01-10T09:45:00Z

### Eun Choi (eun_base)
- `88880001-8888-8888-8888-888888888888` (PUBLIC) "KBO highlights are pure energy." @ 2026-01-19T09:10:00Z
- `88880002-8888-8888-8888-888888888888` (PUBLIC) "Stadium chants stuck in my head." @ 2026-01-18T18:25:00Z
- `88880003-8888-8888-8888-888888888888` (PUBLIC) "Rain delay snacks and cards." @ 2026-01-17T12:40:00Z
- `88880004-8888-8888-8888-888888888888` (PUBLIC) "Tracking batting averages for fun." @ 2026-01-16T08:15:00Z
- `88880005-8888-8888-8888-888888888888` (PUBLIC) "New cap arrived in the mail." @ 2026-01-15T21:05:00Z
- `88880006-8888-8888-8888-888888888888` (PUBLIC) "Listening to radio play-by-play." @ 2026-01-14T07:50:00Z
- `88880007-8888-8888-8888-888888888888` (PUBLIC) "Planning a road trip to a rivalry game." @ 2026-01-13T22:10:00Z
- `88880008-8888-8888-8888-888888888888` (FRIENDS) "Scoreboard watching in extra innings." @ 2026-01-12T11:25:00Z
- `88880009-8888-8888-8888-888888888888` (PUBLIC) "My team finally stole home!" @ 2026-01-11T16:55:00Z
- `8888000a-8888-8888-8888-888888888888` (PRIVATE) "Postgame recap: pitching stole the show." @ 2026-01-10T09:45:00Z

### Lexi Moon (lexi_pierce)
- `99990001-9999-9999-9999-999999999999` (PUBLIC) "Pierce the Veil riffs for breakfast." @ 2026-01-19T09:10:00Z
- `99990002-9999-9999-9999-999999999999` (PUBLIC) "Stage dive dreams, safety first." @ 2026-01-18T18:25:00Z
- `99990003-9999-9999-9999-999999999999` (PUBLIC) "Working on vocal harmonies." @ 2026-01-17T12:40:00Z
- `99990004-9999-9999-9999-999999999999` (PUBLIC) "Merch drop watch party." @ 2026-01-16T08:15:00Z
- `99990005-9999-9999-9999-999999999999` (PUBLIC) "My pedalboard finally works." @ 2026-01-15T21:05:00Z
- `99990006-9999-9999-9999-999999999999` (PUBLIC) "Tattoo idea: tiny mic and roses." @ 2026-01-14T07:50:00Z
- `99990007-9999-9999-9999-999999999999` (PUBLIC) "Set up for a small venue gig." @ 2026-01-13T22:10:00Z
- `99990008-9999-9999-9999-999999999999` (FRIENDS) "Covering King for a Day tonight." @ 2026-01-12T11:25:00Z
- `99990009-9999-9999-9999-999999999999` (PUBLIC) "Metronome at 180 bpm, send help." @ 2026-01-11T16:55:00Z
- `9999000a-9999-9999-9999-999999999999` (PRIVATE) "Post-show ringing ears, worth it." @ 2026-01-10T09:45:00Z

### Noa Kim (noa_animator)
- `aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Blocking an animation for class critique." @ 2026-01-19T09:10:00Z
- `aaaa0002-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Rigging notes got messy, but it works." @ 2026-01-18T18:25:00Z
- `aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Lip sync pass number three." @ 2026-01-17T12:40:00Z
- `aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Exported my first short as mp4." @ 2026-01-16T08:15:00Z
- `aaaa0005-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Motion study from a baseball swing." @ 2026-01-15T21:05:00Z
- `aaaa0006-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Frame timing sheet updated." @ 2026-01-14T07:50:00Z
- `aaaa0007-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Found a new pencil test workflow." @ 2026-01-13T22:10:00Z
- `aaaa0008-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (FRIENDS) "Polishing clean-up lines tonight." @ 2026-01-12T11:25:00Z
- `aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PUBLIC) "Added subtle eye darts in the scene." @ 2026-01-11T16:55:00Z
- `aaaa000a-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (PRIVATE) "Render time finally under 10 minutes." @ 2026-01-10T09:45:00Z

## Follow Model Notes

- Follow graph is one-way: follower -> followee (see list above).
- Feed includes your own posts plus posts from accounts you follow.
- Post notifications are sent to followers of the author.
