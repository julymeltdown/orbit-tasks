package com.example.profile.adapters.in.grpc;

import com.example.profile.adapters.out.memory.InMemoryAvatarRepository;
import com.example.profile.adapters.out.memory.InMemoryProfileRepository;
import com.example.profile.application.service.ProfileService;
import com.example.profile.v1.GetAvatarRequest;
import com.example.profile.v1.GetAvatarResponse;
import com.example.profile.v1.UploadAvatarRequest;
import com.example.profile.v1.UploadAvatarResponse;
import com.google.protobuf.ByteString;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProfileGrpcAvatarTest {

    @Test
    void uploadsAndReadsAvatarThroughGrpc() {
        ProfileGrpcService service = newService();
        CapturingObserver<UploadAvatarResponse> uploadObserver = new CapturingObserver<>();

        service.uploadAvatar(UploadAvatarRequest.newBuilder()
                .setUserId("user-1")
                .setContent(ByteString.copyFrom(new byte[] {1, 3, 5}))
                .setContentType("image/png")
                .build(), uploadObserver);

        assertNotNull(uploadObserver.value());
        assertEquals("/api/profile/avatar/user-1", uploadObserver.value().getAvatarPath());

        CapturingObserver<GetAvatarResponse> getObserver = new CapturingObserver<>();
        service.getAvatar(GetAvatarRequest.newBuilder().setUserId("user-1").build(), getObserver);

        assertNotNull(getObserver.value());
        assertArrayEquals(new byte[] {1, 3, 5}, getObserver.value().getContent().toByteArray());
        assertEquals("image/png", getObserver.value().getContentType());
    }

    @Test
    void returnsNotFoundWhenAvatarDoesNotExist() {
        ProfileGrpcService service = newService();
        CapturingObserver<GetAvatarResponse> observer = new CapturingObserver<>();

        service.getAvatar(GetAvatarRequest.newBuilder().setUserId("missing").build(), observer);

        StatusRuntimeException error = observer.error();
        assertNotNull(error);
        assertEquals(Status.Code.NOT_FOUND, error.getStatus().getCode());
    }

    @Test
    void returnsInvalidArgumentWhenAvatarUploadPayloadIsInvalid() {
        ProfileGrpcService service = newService();
        CapturingObserver<UploadAvatarResponse> observer = new CapturingObserver<>();

        service.uploadAvatar(UploadAvatarRequest.newBuilder()
                .setUserId(" ")
                .setContent(ByteString.EMPTY)
                .build(), observer);

        StatusRuntimeException error = observer.error();
        assertNotNull(error);
        assertEquals(Status.Code.INVALID_ARGUMENT, error.getStatus().getCode());
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
            // no-op
        }

        T value() {
            return value;
        }

        StatusRuntimeException error() {
            return error;
        }
    }
}
