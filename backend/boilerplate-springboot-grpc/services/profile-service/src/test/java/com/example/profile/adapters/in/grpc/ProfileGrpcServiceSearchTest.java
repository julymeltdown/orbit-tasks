package com.example.profile.adapters.in.grpc;

import com.example.profile.adapters.out.memory.InMemoryAvatarRepository;
import com.example.profile.adapters.out.memory.InMemoryProfileRepository;
import com.example.profile.application.service.ProfileService;
import com.example.profile.v1.GetProfilesRequest;
import com.example.profile.v1.GetProfilesResponse;
import com.example.profile.v1.SearchProfilesRequest;
import com.example.profile.v1.SearchProfilesResponse;
import com.example.profile.v1.UpdateProfileRequest;
import com.example.profile.v1.UpdateProfileResponse;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProfileGrpcServiceSearchTest {
    @Test
    void getProfilesReturnsBatch() {
        ProfileGrpcService service = newService();
        service.updateProfile(baseRequest("user-1", "hana", "Hana").build(), new NoopObserver<>());
        service.updateProfile(baseRequest("user-2", "jin", "Jin").build(), new NoopObserver<>());

        RecordingObserver<GetProfilesResponse> observer = new RecordingObserver<>();
        service.getProfiles(GetProfilesRequest.newBuilder()
                .addUserIds("user-1")
                .addUserIds("user-2")
                .build(), observer);

        assertNotNull(observer.value);
        assertEquals(2, observer.value.getProfilesCount());
    }

    @Test
    void searchProfilesFiltersByQuery() {
        ProfileGrpcService service = newService();
        service.updateProfile(baseRequest("user-1", "hana", "Hana").build(), new NoopObserver<>());
        service.updateProfile(baseRequest("user-2", "jin", "Jin").build(), new NoopObserver<>());

        RecordingObserver<SearchProfilesResponse> observer = new RecordingObserver<>();
        service.searchProfiles(SearchProfilesRequest.newBuilder()
                .setQuery("han")
                .setLimit(10)
                .build(), observer);

        assertNotNull(observer.value);
        assertEquals(1, observer.value.getProfilesCount());
        assertEquals("hana", observer.value.getProfiles(0).getUsername());
    }

    private static UpdateProfileRequest.Builder baseRequest(String userId, String username, String nickname) {
        return UpdateProfileRequest.newBuilder()
                .setUserId(userId)
                .setUsername(username)
                .setNickname(nickname)
                .setAvatarUrl("/avatars/cat.svg")
                .setBio("Bio");
    }

    private static ProfileGrpcService newService() {
        InMemoryProfileRepository profileRepository = new InMemoryProfileRepository();
        InMemoryAvatarRepository avatarRepository = new InMemoryAvatarRepository();
        ProfileService profileService = new ProfileService(profileRepository, avatarRepository);
        return new ProfileGrpcService(profileService);
    }

    private static class RecordingObserver<T> implements StreamObserver<T> {
        private T value;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable t) {
            throw new AssertionError("Unexpected error", t);
        }

        @Override
        public void onCompleted() {
            // no-op
        }
    }

    private static class NoopObserver<T> implements StreamObserver<T> {
        @Override
        public void onNext(T value) {
        }

        @Override
        public void onError(Throwable t) {
            throw new AssertionError("Unexpected error", t);
        }

        @Override
        public void onCompleted() {
        }
    }
}
