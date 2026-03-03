package com.example.notification.adapters.in.grpc;

import com.example.notification.application.service.NotificationService;
import com.example.notification.domain.NotificationPage;
import com.example.notification.v1.CreateNotificationRequest;
import com.example.notification.v1.CreateNotificationResponse;
import com.example.notification.v1.ListNotificationsRequest;
import com.example.notification.v1.ListNotificationsResponse;
import com.example.notification.v1.MarkAllNotificationsReadRequest;
import com.example.notification.v1.MarkAllNotificationsReadResponse;
import com.example.notification.v1.MarkNotificationReadRequest;
import com.example.notification.v1.MarkNotificationReadResponse;
import com.example.notification.v1.Notification;
import com.example.notification.v1.NotificationServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class NotificationGrpcService extends NotificationServiceGrpc.NotificationServiceImplBase {
    private final NotificationService notificationService;

    public NotificationGrpcService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void createNotification(CreateNotificationRequest request,
                                   StreamObserver<CreateNotificationResponse> responseObserver) {
        try {
            com.example.notification.domain.Notification notification = notificationService.create(
                    request.getUserId(),
                    request.getType(),
                    request.getPayloadJson(),
                    request.getEventId(),
                    request.getActorId(),
                    request.getOccurredAt());

            responseObserver.onNext(CreateNotificationResponse.newBuilder()
                    .setNotification(toProto(notification))
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listNotifications(ListNotificationsRequest request,
                                  StreamObserver<ListNotificationsResponse> responseObserver) {
        try {
            NotificationPage page = notificationService.list(
                    request.getUserId(),
                    request.getCursor(),
                    request.getLimit());

            ListNotificationsResponse.Builder builder = ListNotificationsResponse.newBuilder();
            for (com.example.notification.domain.Notification notification : page.items()) {
                builder.addItems(toProto(notification));
            }
            if (page.nextCursor() != null && !page.nextCursor().isBlank()) {
                builder.setNextCursor(page.nextCursor());
            }

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void markNotificationRead(MarkNotificationReadRequest request,
                                     StreamObserver<MarkNotificationReadResponse> responseObserver) {
        try {
            NotificationService.MarkReadResult result = notificationService.markRead(
                    request.getUserId(),
                    request.getNotificationId());
            responseObserver.onNext(MarkNotificationReadResponse.newBuilder()
                    .setNotification(toProto(result.notification()))
                    .setUpdated(result.updated())
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void markAllNotificationsRead(MarkAllNotificationsReadRequest request,
                                         StreamObserver<MarkAllNotificationsReadResponse> responseObserver) {
        try {
            long updatedCount = notificationService.markAllRead(request.getUserId());
            responseObserver.onNext(MarkAllNotificationsReadResponse.newBuilder()
                    .setUpdatedCount(updatedCount)
                    .build());
            responseObserver.onCompleted();
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    private static Notification toProto(com.example.notification.domain.Notification notification) {
        String createdAt = notification.createdAt() == null ? "" : notification.createdAt().toString();
        String readAt = notification.readAt() == null ? "" : notification.readAt().toString();

        return Notification.newBuilder()
                .setId(notification.id())
                .setUserId(notification.userId())
                .setType(notification.type())
                .setPayloadJson(notification.payloadJson() == null ? "" : notification.payloadJson())
                .setCreatedAt(createdAt)
                .setReadAt(readAt)
                .setEventId(notification.eventId())
                .setActorId(notification.actorId() == null ? "" : notification.actorId())
                .setOccurredAt(notification.occurredAt() == null ? "" : notification.occurredAt().toString())
                .build();
    }
}
