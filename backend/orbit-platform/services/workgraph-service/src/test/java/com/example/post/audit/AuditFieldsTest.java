package com.example.post.audit;

import com.example.post.adapters.out.persistence.BaseAuditEntity;
import com.example.post.config.audit.AuditorAwareConfig;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditFieldsTest {
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void baseAuditEntityDefinesAuditAnnotations() throws Exception {
        assertNotNull(BaseAuditEntity.class.getAnnotation(MappedSuperclass.class));
        EntityListeners listeners = BaseAuditEntity.class.getAnnotation(EntityListeners.class);
        assertNotNull(listeners);
        assertTrue(java.util.Arrays.asList(listeners.value()).contains(AuditingEntityListener.class));

        assertNotNull(field("createdAt").getAnnotation(CreatedDate.class));
        assertNotNull(field("createdBy").getAnnotation(CreatedBy.class));
        assertNotNull(field("updatedAt").getAnnotation(LastModifiedDate.class));
        assertNotNull(field("updatedBy").getAnnotation(LastModifiedBy.class));
    }

    @Test
    void auditorAwareUsesAuthenticationName() {
        Authentication authentication = new TestingAuthenticationToken("user-1", "password");
        authentication.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        AuditorAware<String> auditorAware = new AuditorAwareConfig().auditorAware();
        assertEquals(Optional.of("user-1"), auditorAware.getCurrentAuditor());
    }

    @Test
    void auditorAwareDefaultsToSystem() {
        AuditorAware<String> auditorAware = new AuditorAwareConfig().auditorAware();
        assertEquals(Optional.of("system"), auditorAware.getCurrentAuditor());
    }

    private Field field(String name) throws NoSuchFieldException {
        Field field = BaseAuditEntity.class.getDeclaredField(name);
        field.setAccessible(true);
        return field;
    }
}
