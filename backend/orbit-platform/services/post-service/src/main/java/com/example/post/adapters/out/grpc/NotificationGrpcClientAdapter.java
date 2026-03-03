package com.example.post.adapters.out.grpc;

import com.example.notification.v1.CreateNotificationRequest;
import com.example.notification.v1.NotificationServiceGrpc;
import com.example.post.application.port.out.NotificationClientPort;
import com.example.post.domain.NotificationRequest;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class NotificationGrpcClientAdapter implements NotificationClientPort {
    private final NotificationServiceGrpc.NotificationServiceBlockingStub stub;

    public NotificationGrpcClientAdapter(NotificationServiceGrpc.NotificationServiceBlockingStub stub) {
        this.stub = stub;
    }

    @Override
    public void createNotification(NotificationRequest request) {
        UUID eventId = request.eventId() == null ? UUID.randomUUID() : request.eventId();
        CreateNotificationRequest.Builder builder = CreateNotificationRequest.newBuilder()
                .setUserId(request.userId().toString())
                .setType(request.type())
                .setPayloadJson(request.payloadJson() == null ? "" : request.payloadJson())
                .setEventId(eventId.toString())
                .setOccurredAt(request.occurredAt() == null ? "" : request.occurredAt());
        if (request.actorId() != null) {
            builder.setActorId(request.actorId().toString());
        }
        stub.createNotification(builder.build());
    }
}
