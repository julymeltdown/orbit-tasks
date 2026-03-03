package com.example.auth.application.port.out;

public interface EmailSenderPort {
    void sendVerificationCode(String email, String code);

    void sendPasswordResetLink(String email, String link);
}
