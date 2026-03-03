package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.friend.FollowActionResponse;
import com.example.gateway.application.dto.friend.FollowCountsResponse;
import com.example.gateway.application.dto.friend.FollowListResponse;
import com.example.gateway.application.dto.friend.FollowRequest;
import com.example.gateway.application.dto.friend.FollowStatusResponse;
import com.example.gateway.application.service.FriendGatewayService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/follows")
public class FriendController {
    private final FriendGatewayService friendService;

    public FriendController(FriendGatewayService friendService) {
        this.friendService = friendService;
    }

    @PostMapping
    public FollowActionResponse follow(@Valid @RequestBody FollowRequest request,
                                       JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return friendService.follow(userId, request.targetUserId());
    }

    @DeleteMapping("/{targetUserId}")
    public FollowActionResponse unfollow(@PathVariable String targetUserId,
                                         JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return friendService.unfollow(userId, targetUserId);
    }

    @GetMapping("/followers")
    public FollowListResponse listFollowers(@RequestParam(required = false) String userId,
                                            @RequestParam(required = false) String cursor,
                                            @RequestParam(required = false) Integer limit,
                                            JwtAuthenticationToken authentication) {
        String resolvedUserId = userId == null || userId.isBlank()
                ? authentication.getToken().getSubject()
                : userId;
        return friendService.listFollowers(resolvedUserId, cursor, limit);
    }

    @GetMapping("/following")
    public FollowListResponse listFollowing(@RequestParam(required = false) String userId,
                                            @RequestParam(required = false) String cursor,
                                            @RequestParam(required = false) Integer limit,
                                            JwtAuthenticationToken authentication) {
        String resolvedUserId = userId == null || userId.isBlank()
                ? authentication.getToken().getSubject()
                : userId;
        return friendService.listFollowing(resolvedUserId, cursor, limit);
    }

    @GetMapping("/counts")
    public FollowCountsResponse counts(@RequestParam(required = false) String userId,
                                       JwtAuthenticationToken authentication) {
        String resolvedUserId = userId == null || userId.isBlank()
                ? authentication.getToken().getSubject()
                : userId;
        return friendService.counts(resolvedUserId);
    }

    @GetMapping("/status")
    public FollowStatusResponse status(@RequestParam String targetUserId,
                                       JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return friendService.status(userId, targetUserId);
    }
}
