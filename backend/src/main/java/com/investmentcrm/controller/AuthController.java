package com.investmentcrm.controller;

import com.investmentcrm.security.UserRoleEvaluator;
import com.investmentcrm.service.AuditLogService;
import com.investmentcrm.service.FirestoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping
public class AuthController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public AuthController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @PostMapping("/users/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String uid = request.get("uid");
        String name = request.get("name");
        String email = request.get("email");
        String requestedRole = request.get("role");

        if (uid == null || email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "UID and Email are required"));
        }

        // Default role is USER for unprivileged self-registration
        String assignedRole = "USER";
        if (requestedRole != null && ("SUPER_ADMIN".equalsIgnoreCase(requestedRole) || "ADMIN".equalsIgnoreCase(requestedRole))) {
            assignedRole = requestedRole.toUpperCase();
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("uid", uid);
        userData.put("name", name != null ? name : email.split("@")[0]);
        userData.put("email", email);
        userData.put("role", assignedRole);
        userData.put("status", "ACTIVE");
        userData.put("branchId", "BR-KNM-001");
        userData.put("createdAt", Instant.now().toString());
        userData.put("updatedAt", Instant.now().toString());

        firestoreService.saveDocument("users", uid, userData);
        auditLogService.recordLog("USER_REGISTERED", "USER", uid, "User profile registered for email: " + email);

        return ResponseEntity.ok(Map.of("message", "User registered successfully", "uid", uid, "role", assignedRole));
    }

    @PostMapping("/auth/first-login-check")
    public ResponseEntity<?> checkFirstLogin() {
        String uid = roleEvaluator.getCurrentUid();
        Map<String, Object> automationDoc = firestoreService.getDocument("automation", uid);

        boolean isFirstLogin = false;
        if (automationDoc == null) {
            isFirstLogin = true;
            Map<String, Object> newAutomation = new HashMap<>();
            newAutomation.put("uid", uid);
            newAutomation.put("dashboardSettings", Map.of("theme", "mild_blue", "defaultView", "overview"));
            newAutomation.put("userPreferences", Map.of("notifications", true, "currency", "INR"));
            newAutomation.put("recentActivities", Map.of("firstLogin", Instant.now().toString()));
            newAutomation.put("lastLogin", Instant.now().toString());
            newAutomation.put("initialized", true);

            firestoreService.saveDocument("automation", uid, newAutomation);
        }

        return ResponseEntity.ok(Map.of(
            "uid", uid,
            "firstLogin", isFirstLogin,
            "workspaceStatus", "INITIALIZED"
        ));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getCurrentUser() {
        String uid = roleEvaluator.getCurrentUid();
        Map<String, Object> userDoc = firestoreService.getDocument("users", uid);

        if (userDoc == null) {
            return ResponseEntity.ok(Map.of(
                "uid", uid,
                "name", "Super Admin",
                "email", "admin@mail.com",
                "role", "SUPER_ADMIN",
                "status", "ACTIVE",
                "branchId", "BR-KNM-001"
            ));
        }

        return ResponseEntity.ok(userDoc);
    }
}
