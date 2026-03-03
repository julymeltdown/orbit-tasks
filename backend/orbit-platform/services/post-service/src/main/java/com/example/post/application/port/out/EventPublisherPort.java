package com.example.post.application.port.out;

import com.example.post.application.event.ExternalEventMessage;
import com.example.post.application.event.InternalEventMessage;

public interface EventPublisherPort {
    void publishInternal(InternalEventMessage message);

    void publishExternal(ExternalEventMessage message);
}
