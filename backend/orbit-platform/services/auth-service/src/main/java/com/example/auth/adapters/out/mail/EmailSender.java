package com.example.auth.adapters.out.mail;

import com.example.auth.application.port.out.EmailSenderPort;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

public class EmailSender implements EmailSenderPort {
    private final JavaMailSender mailSender;
    private final String from;

    public EmailSender(JavaMailSender mailSender, String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendVerificationCode(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Verify your email");
        message.setText("Your verification code is: " + code);
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        mailSender.send(message);
    }

    @Override
    public void sendPasswordResetLink(String email, String link) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Reset your password");
        message.setText("Reset your password using this link: " + link + "\nThis link expires in 1 hour.");
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        mailSender.send(message);
    }
}
