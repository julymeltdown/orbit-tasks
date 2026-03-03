package com.example.profile.domain;

import java.util.List;

public record ProfileSearchPage(
        List<Profile> profiles,
        String nextCursor
) {
}
