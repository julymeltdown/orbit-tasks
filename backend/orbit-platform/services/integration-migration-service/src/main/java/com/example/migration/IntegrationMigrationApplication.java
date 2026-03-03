package com.example.migration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.migration", "com.orbit.migration"})
public class IntegrationMigrationApplication {
    public static void main(String[] args) {
        SpringApplication.run(IntegrationMigrationApplication.class, args);
    }
}
