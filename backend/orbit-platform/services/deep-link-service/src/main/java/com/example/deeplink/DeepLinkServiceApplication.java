package com.example.deeplink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.deeplink", "com.orbit.deeplink"})
public class DeepLinkServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeepLinkServiceApplication.class, args);
    }
}
