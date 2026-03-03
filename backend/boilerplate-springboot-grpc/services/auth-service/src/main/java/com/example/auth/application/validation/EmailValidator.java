package com.example.auth.application.validation;

import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EmailValidator {
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}$");

    private final Set<String> allowedDomains;
    private final Set<String> blockedDomains;

    public EmailValidator() {
        this.allowedDomains = Collections.emptySet();
        this.blockedDomains = Collections.emptySet();
    }

    @Autowired
    public EmailValidator(
            @Value("${auth.email.allowed-domains:}") String allowedDomains,
            @Value("${auth.email.blocked-domains:}") String blockedDomains) {
        this.allowedDomains = parseDomains(allowedDomains);
        this.blockedDomains = parseDomains(blockedDomains);
    }

    public boolean isValid(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }
        String domain = email.substring(email.indexOf('@') + 1).toLowerCase(Locale.ROOT);
        if (!allowedDomains.isEmpty() && !allowedDomains.contains(domain)) {
            return false;
        }
        return !blockedDomains.contains(domain);
    }

    private static Set<String> parseDomains(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptySet();
        }
        return Stream.of(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }
}
