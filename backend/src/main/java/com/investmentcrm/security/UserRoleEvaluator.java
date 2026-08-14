package com.investmentcrm.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserRoleEvaluator {

    public String getCurrentUid() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return auth.getPrincipal().toString();
        }
        return "ANONYMOUS";
    }

    public String getCurrentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            for (GrantedAuthority authority : auth.getAuthorities()) {
                String role = authority.getAuthority();
                if (role.startsWith("ROLE_")) {
                    return role.substring(5);
                }
            }
        }
        return "USER";
    }

    public boolean hasAnyRole(String... requiredRoles) {
        String currentRole = getCurrentRole();
        for (String r : requiredRoles) {
            if (r.equalsIgnoreCase(currentRole)) {
                return true;
            }
        }
        return false;
    }

    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equalsIgnoreCase(getCurrentRole());
    }

    public boolean isAdminOrHigher() {
        return hasAnyRole("SUPER_ADMIN", "ADMIN");
    }

    public boolean isManagerOrHigher() {
        return hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER");
    }
}
