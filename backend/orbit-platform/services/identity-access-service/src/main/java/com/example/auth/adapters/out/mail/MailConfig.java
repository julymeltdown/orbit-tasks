package com.example.auth.adapters.out.mail;

import com.example.auth.application.port.out.EmailSenderPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class MailConfig {
    @Bean
    public EmailSenderPort emailSender(JavaMailSender mailSender,
                                       @Value("${smtp.from:no-reply@example.com}") String from) {
        return new EmailSender(mailSender, from);
    }
}
