package com.example.gateway.application.dto.profile;

import java.util.List;

public record ProfileBatchRequest(
        List<String> userIds
) {
}
