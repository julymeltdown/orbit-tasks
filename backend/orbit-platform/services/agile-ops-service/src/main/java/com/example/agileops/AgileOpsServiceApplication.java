package com.example.agileops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.agileops", "com.orbit.agile"})
public class AgileOpsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgileOpsServiceApplication.class, args);
    }
}
