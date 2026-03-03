package com.example.post.adapters.out.grpc;

import com.example.friend.v1.FriendServiceGrpc;
import com.example.notification.v1.NotificationServiceGrpc;
import com.example.profile.v1.ProfileServiceGrpc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.grpc.client.GrpcChannelFactory;

@Configuration
public class GrpcClientsConfig {
    @Bean
    ProfileServiceGrpc.ProfileServiceBlockingStub profileStub(GrpcChannelFactory channels) {
        return ProfileServiceGrpc.newBlockingStub(channels.createChannel("profile"));
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
