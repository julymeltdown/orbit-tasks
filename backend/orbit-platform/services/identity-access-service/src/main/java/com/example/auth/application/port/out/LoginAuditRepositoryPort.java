package com.example.auth.application.port.out;

import com.example.auth.domain.LoginAudit;

public interface LoginAuditRepositoryPort {
    LoginAudit save(LoginAudit audit);
}
