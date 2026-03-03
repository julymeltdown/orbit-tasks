package com.example.profile.adapters.in.grpc;

import com.example.profile.application.service.ProfileService;
import com.example.profile.domain.Avatar;
import com.example.profile.domain.ProfileSearchPage;
import com.example.profile.v1.GetAvatarRequest;
import com.example.profile.v1.GetAvatarResponse;
import com.example.profile.v1.GetProfileByUsernameRequest;
import com.example.profile.v1.GetProfileRequest;
import com.example.profile.v1.GetProfileResponse;
import com.example.profile.v1.GetProfilesRequest;
import com.example.profile.v1.GetProfilesResponse;
import com.example.profile.v1.Profile;
import com.example.profile.v1.ProfileServiceGrpc;
import com.example.profile.v1.SearchProfilesRequest;
import com.example.profile.v1.SearchProfilesResponse;
import com.example.profile.v1.UpdateProfileRequest;
import com.example.profile.v1.UpdateProfileResponse;
import com.example.profile.v1.UploadAvatarRequest;
import com.example.profile.v1.UploadAvatarResponse;
import com.google.protobuf.ByteString;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.List;
import java.util.Optional;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class ProfileGrpcService extends ProfileServiceGrpc.ProfileServiceImplBase {
    private final ProfileService profileService;

    public ProfileGrpcService(ProfileService profileService) {
        this.profileService = profileService;
    }

    @Override
    public void getProfile(GetProfileRequest request, StreamObserver<GetProfileResponse> responseObserver) {
        try {
            com.example.profile.domain.Profile profile = profileService.getProfile(request.getUserId());
            responseObserver.onNext(GetProfileResponse.newBuilder().setProfile(toProto(profile)).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondInvalid(responseObserver, ex.getMessage());
        }
    }

    @Override
    public void getProfileByUsername(GetProfileByUsernameRequest request,
                                     StreamObserver<GetProfileResponse> responseObserver) {
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            respondInvalid(responseObserver, "Username is required");
            return;
        }

        Optional<com.example.profile.domain.Profile> profile = profileService.getProfileByUsername(username);
        if (profile.isEmpty()) {
            respondNotFound(responseObserver, "Profile not found");
            return;
        }

        responseObserver.onNext(GetProfileResponse.newBuilder().setProfile(toProto(profile.get())).build());
        responseObserver.onCompleted();
    }

    @Override
    public void getProfiles(GetProfilesRequest request, StreamObserver<GetProfilesResponse> responseObserver) {
        List<com.example.profile.domain.Profile> profiles = profileService.getProfiles(request.getUserIdsList());

        GetProfilesResponse.Builder builder = GetProfilesResponse.newBuilder();
        for (com.example.profile.domain.Profile profile : profiles) {
            builder.addProfiles(toProto(profile));
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void updateProfile(UpdateProfileRequest request, StreamObserver<UpdateProfileResponse> responseObserver) {
        try {
            com.example.profile.domain.Profile profile = profileService.updateProfile(
                    request.getUserId(),
                    request.getUsername(),
                    request.getNickname(),
                    request.getAvatarUrl(),
                    request.getBio());

            responseObserver.onNext(UpdateProfileResponse.newBuilder().setProfile(toProto(profile)).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondInvalid(responseObserver, ex.getMessage());
        }
    }

    @Override
    public void searchProfiles(SearchProfilesRequest request,
                               StreamObserver<SearchProfilesResponse> responseObserver) {
        try {
            ProfileSearchPage page = profileService.searchProfiles(
                    request.getQuery(),
                    request.getCursor(),
                    request.getLimit());

            SearchProfilesResponse.Builder responseBuilder = SearchProfilesResponse.newBuilder();
            for (com.example.profile.domain.Profile profile : page.profiles()) {
                responseBuilder.addProfiles(toProto(profile));
            }
            if (page.nextCursor() != null && !page.nextCursor().isBlank()) {
                responseBuilder.setNextCursor(page.nextCursor());
            }

            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondInvalid(responseObserver, ex.getMessage());
        }
    }

    @Override
    public void uploadAvatar(UploadAvatarRequest request,
                             StreamObserver<UploadAvatarResponse> responseObserver) {
        try {
            String avatarPath = profileService.uploadAvatar(
                    request.getUserId(),
                    request.getContent().toByteArray(),
                    request.getContentType());

            responseObserver.onNext(UploadAvatarResponse.newBuilder().setAvatarPath(avatarPath).build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondInvalid(responseObserver, ex.getMessage());
        }
    }

    @Override
    public void getAvatar(GetAvatarRequest request, StreamObserver<GetAvatarResponse> responseObserver) {
        try {
            Optional<Avatar> avatar = profileService.getAvatar(request.getUserId());
            if (avatar.isEmpty()) {
                responseObserver.onError(Status.NOT_FOUND.withDescription("Avatar not found").asRuntimeException());
                return;
            }

            responseObserver.onNext(GetAvatarResponse.newBuilder()
                    .setContent(ByteString.copyFrom(avatar.get().content()))
                    .setContentType(avatar.get().contentType())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            respondInvalid(responseObserver, ex.getMessage());
        }
    }

    private static Profile toProto(com.example.profile.domain.Profile profile) {
        return Profile.newBuilder()
                .setUserId(profile.userId())
                .setUsername(profile.username() == null ? "" : profile.username())
                .setNickname(profile.nickname() == null ? "" : profile.nickname())
                .setAvatarUrl(profile.avatarUrl() == null ? "" : profile.avatarUrl())
                .setBio(profile.bio() == null ? "" : profile.bio())
                .setFollowerCount(profile.followerCount())
                .setFollowingCount(profile.followingCount())
                .setPostCount(profile.postCount())
                .build();
    }

    private void respondInvalid(StreamObserver<?> responseObserver, String message) {
        responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(message).asRuntimeException());
    }

    private void respondNotFound(StreamObserver<?> responseObserver, String message) {
        responseObserver.onError(Status.NOT_FOUND.withDescription(message).asRuntimeException());
    }
}
