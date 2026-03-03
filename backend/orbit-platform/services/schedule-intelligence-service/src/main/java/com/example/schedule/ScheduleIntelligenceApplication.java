package com.example.schedule;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.schedule", "com.orbit.schedule"})
public class ScheduleIntelligenceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScheduleIntelligenceApplication.class, args);
    }
}
