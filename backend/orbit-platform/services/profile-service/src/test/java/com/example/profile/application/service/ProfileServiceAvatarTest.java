package com.example.profile.application.service;

import com.example.profile.adapters.out.memory.InMemoryAvatarRepository;
import com.example.profile.adapters.out.memory.InMemoryProfileRepository;
import com.example.profile.domain.Avatar;
import com.example.profile.domain.Profile;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProfileServiceAvatarTest {

    @Test
    void uploadsAndFetchesAvatarWithDefaultContentType() {
        ProfileService service = newService();
        byte[] image = new byte[] {1, 2, 3, 4};

        String path = service.uploadAvatar("user-1", image, "");
        Avatar avatar = service.getAvatar("user-1").orElseThrow();

        assertEquals("/api/profile/avatar/user-1", path);
        assertArrayEquals(image, avatar.content());
        assertEquals("application/octet-stream", avatar.contentType());
    }

    @Test
    void validatesAvatarUploadInput() {
        ProfileService service = newService();

        IllegalArgumentException missingUser = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAvatar(" ", new byte[] {1}, "image/png"));
        IllegalArgumentException missingContent = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAvatar("user-1", new byte[0], "image/png"));
        IllegalArgumentException oversize = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAvatar("user-1", new byte[5 * 1024 * 1024 + 1], "image/png"));

        assertEquals("User ID is required", missingUser.getMessage());
        assertEquals("Avatar image is required", missingContent.getMessage());
        assertEquals("Avatar image must be <= 5MB", oversize.getMessage());
    }

    @Test
    void validatesAvatarLookupInput() {
        ProfileService service = newService();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.getAvatar(""));

        assertEquals("User ID is required", exception.getMessage());
    }

    @Test
    void clearAllRemovesProfilesAndAvatars() {
        ProfileService service = newService();
        service.updateProfile("user-1", "user_one", "User One", "/avatars/one.png", "bio");
        service.uploadAvatar("user-1", new byte[] {9, 9}, "image/png");

        service.clearAll();

        Profile profile = service.getProfile("user-1");
        assertEquals("", profile.username());
        assertTrue(service.getAvatar("user-1").isEmpty());
    }

    private static ProfileService newService() {
        return new ProfileService(new InMemoryProfileRepository(), new InMemoryAvatarRepository());
    }
}
