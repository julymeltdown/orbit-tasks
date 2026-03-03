package com.example.post.adapters.out.kafka;

import com.example.post.application.port.out.EventPublisherPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EventPublisherConfig {
    @Bean
    @ConditionalOnMissingBean(EventPublisherPort.class)
    EventPublisherPort noopEventPublisher() {
        return new NoopEventPublisher();
    }
}
