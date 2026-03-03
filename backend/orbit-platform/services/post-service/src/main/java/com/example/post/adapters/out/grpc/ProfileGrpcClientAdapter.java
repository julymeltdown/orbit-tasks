package com.example.post.adapters.out.grpc;

import com.example.post.application.port.out.ProfileClientPort;
import com.example.post.domain.ProfileSnapshot;
import com.example.profile.v1.GetProfileRequest;
import com.example.profile.v1.GetProfileResponse;
import com.example.profile.v1.Profile;
import com.example.profile.v1.ProfileServiceGrpc;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ProfileGrpcClientAdapter implements ProfileClientPort {
    private final ProfileServiceGrpc.ProfileServiceBlockingStub stub;

    public ProfileGrpcClientAdapter(ProfileServiceGrpc.ProfileServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public ProfileSnapshot fetchProfile(UUID userId) {
        GetProfileResponse response = stub.getProfile(GetProfileRequest.newBuilder()
                .setUserId(userId.toString())
                .build());
        if (!response.hasProfile()) {
            throw new IllegalArgumentException("Profile not found");
        }
        Profile profile = response.getProfile();
        return new ProfileSnapshot(
                UUID.fromString(profile.getUserId()),
                profile.getNickname(),
                profile.getAvatarUrl(),
                profile.getBio());
    }
}
