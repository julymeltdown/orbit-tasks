package com.example.post.adapters.in.rest;

import com.example.post.application.event.EventReplayFilter;
import com.example.post.application.event.EventReplayService;
import com.example.post.application.event.ReplayTarget;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/events")
public class EventReplayController {
    private final EventReplayService replayService;

    public EventReplayController(EventReplayService replayService) {
        this.replayService = replayService;
    }

    @PostMapping("/replay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventReplayResponse> replay(@RequestBody EventReplayRequest request) {
        EventReplayFilter filter = new EventReplayFilter(
                request.actorId(),
                request.eventType(),
                request.attribute(),
                request.from(),
                request.to(),
                request.published()
        );
        ReplayTarget target = request.target() == null ? ReplayTarget.INTERNAL : request.target();
        int limit = request.limit() == null ? 100 : request.limit();
        int count = replayService.replay(filter, target, limit);
        return ResponseEntity.ok(new EventReplayResponse(count));
    }

    public record EventReplayRequest(
            UUID actorId,
            String eventType,
            String attribute,
            Instant from,
            Instant to,
            Boolean published,
            ReplayTarget target,
            Integer limit
    ) {
    }

    public record EventReplayResponse(int replayedCount) {
    }
}
