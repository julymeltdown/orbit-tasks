package com.example.gateway.application.dto.post;

import java.util.List;

public record PostDetailResponse(
        PostResponse post,
        List<CommentResponse> comments
) {
}
