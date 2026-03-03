package com.example.profile.adapters.in.grpc;

import com.example.profile.adapters.out.memory.InMemoryAvatarRepository;
import com.example.profile.adapters.out.memory.InMemoryProfileRepository;
import com.example.profile.application.service.ProfileService;
import com.example.profile.v1.GetProfileRequest;
import com.example.profile.v1.GetProfileResponse;
import com.example.profile.v1.GetProfileByUsernameRequest;
import com.example.profile.v1.UpdateProfileRequest;
import com.example.profile.v1.UpdateProfileResponse;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProfileGrpcServiceValidationTest {

    @Test
    void rejectsMissingUsername() {
        ProfileGrpcService service = newService();
        CapturingObserver<UpdateProfileResponse> observer = new CapturingObserver<>();

        UpdateProfileRequest request = baseRequest("user-1")
                .clearUsername()
                .build();

        service.updateProfile(request, observer);

        StatusRuntimeException error = observer.error();
        assertNotNull(error);
        assertEquals(Status.Code.INVALID_ARGUMENT, error.getStatus().getCode());
        assertEquals("Username is required", error.getStatus().getDescription());
    }

    @Test
    void rejectsInvalidUsernamePattern() {
        ProfileGrpcService service = newService();
        CapturingObserver<UpdateProfileResponse> observer = new CapturingObserver<>();

        UpdateProfileRequest request = baseRequest("user-1")
                .setUsername("bad name")
                .build();

        service.updateProfile(request, observer);

        StatusRuntimeException error = observer.error();
        assertNotNull(error);
        assertEquals(Status.Code.INVALID_ARGUMENT, error.getStatus().getCode());
        assertEquals("Username must be 3-20 characters (letters, numbers, underscore)",
                error.getStatus().getDescription());
    }

    @Test
    void rejectsDuplicateUsername() {
        ProfileGrpcService service = newService();
        CapturingObserver<UpdateProfileResponse> firstObserver = new CapturingObserver<>();
        CapturingObserver<UpdateProfileResponse> secondObserver = new CapturingObserver<>();

        service.updateProfile(baseRequest("user-1").setUsername("alpha").build(), firstObserver);
        service.updateProfile(baseRequest("user-2").setUsername("alpha").build(), secondObserver);

        StatusRuntimeException error = secondObserver.error();
        assertNotNull(error);
        assertEquals(Status.Code.INVALID_ARGUMENT, error.getStatus().getCode());
        assertEquals("Username already taken", error.getStatus().getDescription());
    }

    @Test
    void returnsStoredProfileOnGet() {
        ProfileGrpcService service = newService();
        CapturingObserver<UpdateProfileResponse> updateObserver = new CapturingObserver<>();
        service.updateProfile(baseRequest("user-1").setUsername("alpha").build(), updateObserver);

        CapturingObserver<GetProfileResponse> getObserver = new CapturingObserver<>();
        service.getProfile(GetProfileRequest.newBuilder().setUserId("user-1").build(), getObserver);

        assertNotNull(getObserver.value());
        assertEquals("alpha", getObserver.value().getProfile().getUsername());
    }

    @Test
    void returnsProfileByUsername() {
        ProfileGrpcService service = newService();
        CapturingObserver<UpdateProfileResponse> updateObserver = new CapturingObserver<>();
        service.updateProfile(baseRequest("user-1").setUsername("alpha").build(), updateObserver);

        CapturingObserver<GetProfileResponse> getObserver = new CapturingObserver<>();
        service.getProfileByUsername(
                GetProfileByUsernameRequest.newBuilder().setUsername("alpha").build(),
                getObserver);

        assertNotNull(getObserver.value());
        assertEquals("user-1", getObserver.value().getProfile().getUserId());
    }

    @Test
    void rejectsMissingUsernameOnLookup() {
        ProfileGrpcService service = newService();
        CapturingObserver<GetProfileResponse> getObserver = new CapturingObserver<>();

        service.getProfileByUsername(GetProfileByUsernameRequest.newBuilder().build(), getObserver);

        StatusRuntimeException error = getObserver.error();
        assertNotNull(error);
        assertEquals(Status.Code.INVALID_ARGUMENT, error.getStatus().getCode());
    }

    @Test
    void returnsNotFoundForUnknownUsername() {
        ProfileGrpcService service = newService();
        CapturingObserver<GetProfileResponse> getObserver = new CapturingObserver<>();

        service.getProfileByUsername(
                GetProfileByUsernameRequest.newBuilder().setUsername("missing").build(),
                getObserver);

        StatusRuntimeException error = getObserver.error();
        assertNotNull(error);
        assertEquals(Status.Code.NOT_FOUND, error.getStatus().getCode());
    }

    private UpdateProfileRequest.Builder baseRequest(String userId) {
        String safeSuffix = userId.replace("-", "");
        return UpdateProfileRequest.newBuilder()
                .setUserId(userId)
                .setUsername("user_" + safeSuffix)
                .setNickname("User " + userId)
                .setAvatarUrl("https://example.com/avatar.png")
                .setBio("Hello there");
    }

    private static ProfileGrpcService newService() {
        InMemoryProfileRepository profileRepository = new InMemoryProfileRepository();
        InMemoryAvatarRepository avatarRepository = new InMemoryAvatarRepository();
        ProfileService profileService = new ProfileService(profileRepository, avatarRepository);
        return new ProfileGrpcService(profileService);
    }

    private static class CapturingObserver<T> implements StreamObserver<T> {
        private T value;
        private StatusRuntimeException error;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable t) {
            if (t instanceof StatusRuntimeException statusRuntimeException) {
                this.error = statusRuntimeException;
            } else {
                this.error = Status.fromThrowable(t).asRuntimeException();
            }
        }

        @Override
        public void onCompleted() {
            // No-op for test observer.
        }

        T value() {
            return value;
        }

        StatusRuntimeException error() {
            return error;
        }
    }
}
