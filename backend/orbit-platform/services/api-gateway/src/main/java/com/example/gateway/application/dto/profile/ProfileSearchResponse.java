package com.example.gateway.application.dto.profile;

import java.util.List;

public record ProfileSearchResponse(
        List<ProfileResponse> profiles,
        String nextCursor
) {
}
