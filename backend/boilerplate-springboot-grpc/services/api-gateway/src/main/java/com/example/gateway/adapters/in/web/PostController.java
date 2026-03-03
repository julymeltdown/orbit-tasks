package com.example.gateway.adapters.in.web;

import com.example.gateway.application.dto.post.CommentCreateRequest;
import com.example.gateway.application.dto.post.CommentResponse;
import com.example.gateway.application.dto.post.FeedResponse;
import com.example.gateway.application.dto.post.PostCreateRequest;
import com.example.gateway.application.dto.post.PostDetailResponse;
import com.example.gateway.application.dto.post.PostLikeResponse;
import com.example.gateway.application.dto.post.PostResponse;
import com.example.gateway.application.service.PostGatewayService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PostController {
    private final PostGatewayService postService;

    public PostController(PostGatewayService postService) {
        this.postService = postService;
    }

    @GetMapping("/feed")
    public FeedResponse getFeed(@RequestParam(name = "cursor", required = false) String cursor,
                                @RequestParam(name = "limit", defaultValue = "10") int limit,
                                JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.getFeed(userId, cursor, limit);
    }

    @GetMapping("/posts/author/{authorId}")
    public FeedResponse getAuthorPosts(@PathVariable String authorId,
                                       @RequestParam(name = "cursor", required = false) String cursor,
                                       @RequestParam(name = "limit", defaultValue = "10") int limit,
                                       JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.getAuthorPosts(authorId, userId, cursor, limit);
    }

    @GetMapping("/posts/search")
    public FeedResponse searchPosts(@RequestParam(name = "q") String query,
                                    @RequestParam(name = "cursor", required = false) String cursor,
                                    @RequestParam(name = "limit", defaultValue = "10") int limit,
                                    JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.searchPosts(userId, query, cursor, limit);
    }

    @GetMapping("/posts/trending")
    public FeedResponse getTrending(@RequestParam(name = "cursor", required = false) String cursor,
                                    @RequestParam(name = "limit", defaultValue = "10") int limit,
                                    JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.getTrending(userId, cursor, limit);
    }

    @GetMapping("/posts/{postId}")
    public PostDetailResponse getPost(@PathVariable String postId,
                                      JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.getPost(userId, postId);
    }

    @PostMapping("/posts")
    public PostResponse createPost(@Valid @RequestBody PostCreateRequest request,
                                   JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.createPost(userId, request);
    }

    @PostMapping("/posts/{postId}/comments")
    public CommentResponse createComment(@PathVariable String postId,
                                         @Valid @RequestBody CommentCreateRequest request,
                                         JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.createComment(userId, postId, request);
    }

    @PostMapping("/posts/{postId}/likes")
    public PostLikeResponse likePost(@PathVariable String postId,
                                     JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.likePost(userId, postId);
    }

    @DeleteMapping("/posts/{postId}/likes")
    public PostLikeResponse unlikePost(@PathVariable String postId,
                                       JwtAuthenticationToken authentication) {
        String userId = authentication.getToken().getSubject();
        return postService.unlikePost(userId, postId);
    }
}
