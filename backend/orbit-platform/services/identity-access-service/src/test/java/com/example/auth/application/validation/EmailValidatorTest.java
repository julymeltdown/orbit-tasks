package com.example.auth.application.validation;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class EmailValidatorTest {
    private final EmailValidator validator = new EmailValidator();

    @Test
    void acceptsValidEmail() {
        assertThat(validator.isValid("user@example.com")).isTrue();
    }

    @Test
    void rejectsInvalidEmail() {
        assertThat(validator.isValid("bad-email")).isFalse();
    }
}
