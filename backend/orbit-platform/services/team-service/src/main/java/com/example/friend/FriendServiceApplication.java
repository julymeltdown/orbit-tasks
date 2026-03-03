package com.example.friend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.friend", "com.orbit.team"})
public class FriendServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FriendServiceApplication.class, args);
    }
}
