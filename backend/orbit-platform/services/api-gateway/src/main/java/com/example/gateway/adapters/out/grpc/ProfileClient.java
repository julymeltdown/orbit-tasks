package com.example.gateway.adapters.out.grpc;

import com.example.gateway.application.dto.profile.AvatarContent;
import com.example.gateway.application.dto.profile.ProfileBatchResponse;
import com.example.gateway.application.dto.profile.ProfileResponse;
import com.example.gateway.application.dto.profile.ProfileSearchResponse;
import com.example.gateway.application.dto.profile.ProfileUpdateRequest;
import com.example.gateway.application.port.out.ProfileClientPort;
import com.example.profile.v1.GetAvatarRequest;
import com.example.profile.v1.GetProfileByUsernameRequest;
import com.example.profile.v1.GetProfileRequest;
import com.example.profile.v1.GetProfilesRequest;
import com.example.profile.v1.ProfileServiceGrpc;
import com.example.profile.v1.SearchProfilesRequest;
import com.example.profile.v1.UpdateProfileRequest;
import com.example.profile.v1.UploadAvatarRequest;
import java.util.List;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class ProfileClient implements ProfileClientPort {
    private final ProfileServiceGrpc.ProfileServiceBlockingStub stub;

    public ProfileClient(ProfileServiceGrpc.ProfileServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public ProfileResponse getProfile(String userId) {
        var response = stub.getProfile(GetProfileRequest.newBuilder().setUserId(userId).build());
        return toResponse(response.getProfile());
    }

    @Override
    public ProfileResponse getProfileByUsername(String username) {
        var response = stub.getProfileByUsername(
                GetProfileByUsernameRequest.newBuilder().setUsername(username).build());
        return toResponse(response.getProfile());
    }

    @Override
    public ProfileBatchResponse getProfiles(Iterable<String> userIds) {
        GetProfilesRequest.Builder builder = GetProfilesRequest.newBuilder();
        if (userIds != null) {
            for (String userId : userIds) {
                if (StringUtils.hasText(userId)) {
                    builder.addUserIds(userId);
                }
            }
        }
        var response = stub.getProfiles(builder.build());
        List<ProfileResponse> profiles = response.getProfilesList().stream()
                .map(this::toResponse)
                .toList();
        return new ProfileBatchResponse(profiles);
    }

    @Override
    public ProfileSearchResponse searchProfiles(String query, String cursor, int limit) {
        SearchProfilesRequest.Builder builder = SearchProfilesRequest.newBuilder()
                .setQuery(defaultString(query))
                .setLimit(limit);
        if (StringUtils.hasText(cursor)) {
            builder.setCursor(cursor);
        }
        var response = stub.searchProfiles(builder.build());
        List<ProfileResponse> profiles = response.getProfilesList().stream()
                .map(this::toResponse)
                .toList();
        return new ProfileSearchResponse(profiles, response.getNextCursor().isBlank() ? null : response.getNextCursor());
    }

    @Override
    public AvatarContent getAvatar(String userId) {
        var response = stub.getAvatar(GetAvatarRequest.newBuilder().setUserId(userId).build());
        return new AvatarContent(response.getContent().toByteArray(), response.getContentType());
    }

    @Override
    public String uploadAvatar(String userId, byte[] content, String contentType, String filename) {
        UploadAvatarRequest.Builder builder = UploadAvatarRequest.newBuilder()
                .setUserId(userId)
                .setContent(com.google.protobuf.ByteString.copyFrom(content));
        if (StringUtils.hasText(contentType)) {
            builder.setContentType(contentType);
        }
        if (StringUtils.hasText(filename)) {
            builder.setFilename(filename);
        }
        var response = stub.uploadAvatar(builder.build());
        return response.getAvatarPath();
    }

    @Override
    public ProfileResponse updateProfile(String userId, ProfileUpdateRequest request) {
        UpdateProfileRequest grpcRequest = UpdateProfileRequest.newBuilder()
                .setUserId(userId)
                .setUsername(defaultString(request.username()))
                .setNickname(defaultString(request.nickname()))
                .setAvatarUrl(defaultString(request.avatarUrl()))
                .setBio(defaultString(request.bio()))
                .build();
        var response = stub.updateProfile(grpcRequest);
        return toResponse(response.getProfile());
    }

    private ProfileResponse toResponse(com.example.profile.v1.Profile profile) {
        return new ProfileResponse(
                profile.getUserId(),
                profile.getUsername(),
                profile.getNickname(),
                profile.getAvatarUrl(),
                profile.getBio(),
                profile.getFollowerCount(),
                profile.getFollowingCount(),
                profile.getPostCount());
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }
}
