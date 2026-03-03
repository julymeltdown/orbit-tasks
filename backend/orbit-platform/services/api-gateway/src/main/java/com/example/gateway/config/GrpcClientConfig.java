package com.example.gateway.config;

import com.example.auth.v1.AuthServiceGrpc;
import com.example.friend.v1.FriendServiceGrpc;
import com.example.notification.v1.NotificationServiceGrpc;
import com.orbit.identity.v1.IdentityAccessServiceGrpc;
import com.example.post.v1.PostServiceGrpc;
import com.example.profile.v1.ProfileServiceGrpc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.grpc.client.GrpcChannelFactory;

@Configuration
public class GrpcClientConfig {

    @Bean
    AuthServiceGrpc.AuthServiceBlockingStub authStub(GrpcChannelFactory channels) {
        return AuthServiceGrpc.newBlockingStub(channels.createChannel("auth"));
    }

    @Bean
    IdentityAccessServiceGrpc.IdentityAccessServiceBlockingStub identityStub(GrpcChannelFactory channels) {
        return IdentityAccessServiceGrpc.newBlockingStub(channels.createChannel("identity"));
    }

    @Bean
    ProfileServiceGrpc.ProfileServiceBlockingStub profileStub(GrpcChannelFactory channels) {
        return ProfileServiceGrpc.newBlockingStub(channels.createChannel("profile"));
    }

    @Bean
    PostServiceGrpc.PostServiceBlockingStub postStub(GrpcChannelFactory channels) {
        return PostServiceGrpc.newBlockingStub(channels.createChannel("post"));
    }

    @Bean
    FriendServiceGrpc.FriendServiceBlockingStub friendStub(GrpcChannelFactory channels) {
        return FriendServiceGrpc.newBlockingStub(channels.createChannel("friend"));
    }

    @Bean
    NotificationServiceGrpc.NotificationServiceBlockingStub notificationStub(GrpcChannelFactory channels) {
        return NotificationServiceGrpc.newBlockingStub(channels.createChannel("notification"));
    }
}
