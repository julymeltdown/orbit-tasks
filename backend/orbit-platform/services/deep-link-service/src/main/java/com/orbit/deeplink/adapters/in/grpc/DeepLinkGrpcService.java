package com.orbit.deeplink.adapters.in.grpc;

import com.orbit.deeplink.application.service.DeepLinkResolutionService;
import org.springframework.grpc.server.service.GrpcService;

@GrpcService
public class DeepLinkGrpcService {
    private final DeepLinkResolutionService resolutionService;

    public DeepLinkGrpcService(DeepLinkResolutionService resolutionService) {
        this.resolutionService = resolutionService;
    }

    public DeepLinkResolutionService.Resolution resolve(String token, String actorId, boolean authenticated) {
        return resolutionService.resolve(token, actorId, authenticated);
    }
}
