package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.profile.AvatarContent;
import com.example.gateway.application.dto.profile.AvatarUploadResponse;
import com.example.gateway.application.dto.profile.ProfileBatchRequest;
import com.example.gateway.application.dto.profile.ProfileBatchResponse;
import com.example.gateway.application.dto.profile.ProfileResponse;
import com.example.gateway.application.dto.profile.ProfileSearchResponse;
import com.example.gateway.application.dto.profile.ProfileUpdateRequest;
import com.example.gateway.application.service.ProfileGatewayService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileGatewayService profileService;

    public ProfileController(ProfileGatewayService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/{userId}")
    public ProfileResponse getProfile(@PathVariable String userId) {
        return profileService.getProfile(userId);
    }

    @GetMapping("/username/{username}")
    public ProfileResponse getProfileByUsername(@PathVariable String username) {
        return profileService.getProfileByUsername(username);
    }

    @PostMapping("/batch")
    public ProfileBatchResponse getProfiles(@RequestBody ProfileBatchRequest request) {
        return profileService.getProfiles(request.userIds());
    }

    @GetMapping("/search")
    public ProfileSearchResponse searchProfiles(@RequestParam(name = "q") String query,
                                                @RequestParam(name = "cursor", required = false) String cursor,
                                                @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return profileService.searchProfiles(query, cursor, limit);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AvatarUploadResponse uploadAvatar(@RequestParam("file") MultipartFile file,
                                             JwtAuthenticationToken authentication) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar image is required");
        }
        String userId = authentication.getToken().getSubject();
        String filename = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "";
        String avatarPath;
        try {
            avatarPath = profileService.uploadAvatar(
                    userId,
                    file.getBytes(),
                    file.getContentType(),
                    filename);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
        return new AvatarUploadResponse(avatarPath);
    }

    @GetMapping("/avatar/{userId}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String userId) {
        AvatarContent avatar = profileService.getAvatar(userId);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (StringUtils.hasText(avatar.contentType())) {
            mediaType = MediaType.parseMediaType(avatar.contentType());
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(avatar.content());
    }

    @PutMapping("/{userId}")
    public ProfileResponse updateProfile(@PathVariable String userId,
                                         @Valid @RequestBody ProfileUpdateRequest request,
                                         JwtAuthenticationToken authentication) {
        enforceOwner(userId, authentication);
        return profileService.updateProfile(userId, request);
    }

    private void enforceOwner(String userId, JwtAuthenticationToken authentication) {
        String subject = authentication.getToken().getSubject();
        if (!userId.equals(subject)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
    }
}
