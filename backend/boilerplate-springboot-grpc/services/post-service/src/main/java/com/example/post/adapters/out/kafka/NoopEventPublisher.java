package com.example.post.adapters.out.kafka;

import com.example.post.application.event.ExternalEventMessage;
import com.example.post.application.event.InternalEventMessage;
import com.example.post.application.port.out.EventPublisherPort;

public class NoopEventPublisher implements EventPublisherPort {
    @Override
    public void publishInternal(InternalEventMessage message) {
    }

    @Override
    public void publishExternal(ExternalEventMessage message) {
    }
}
