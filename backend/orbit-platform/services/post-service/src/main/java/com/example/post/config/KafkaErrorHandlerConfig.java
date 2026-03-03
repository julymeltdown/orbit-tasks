package com.example.post.config;

import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;

@Configuration
public class KafkaErrorHandlerConfig {
    @Bean
    DefaultErrorHandler kafkaErrorHandler(
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${post.events.internal-dlt-topic:post.internal-events.dlt}") String internalDltTopic,
            @Value("${post.kafka.retry.max-attempts:5}") int maxAttempts,
            @Value("${post.kafka.retry.initial-interval:500}") long initialInterval,
            @Value("${post.kafka.retry.multiplier:2.0}") double multiplier,
            @Value("${post.kafka.retry.max-interval:10000}") long maxInterval) {
        ExponentialBackOffWithMaxRetries backOff =
                new ExponentialBackOffWithMaxRetries(Math.max(0, maxAttempts - 1));
        backOff.setInitialInterval(Math.max(1L, initialInterval));
        backOff.setMultiplier(multiplier <= 1.0 ? 2.0 : multiplier);
        backOff.setMaxInterval(Math.max(1L, maxInterval));

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaTemplate,
                (record, ex) -> new TopicPartition(internalDltTopic, record.partition()));
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);
        handler.addNotRetryableExceptions(IllegalArgumentException.class);
        return handler;
    }
}
