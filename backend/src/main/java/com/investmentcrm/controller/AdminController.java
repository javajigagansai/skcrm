package com.investmentcrm.controller;

import com.investmentcrm.security.UserRoleEvaluator;
import com.investmentcrm.service.AuditLogService;
import com.investmentcrm.service.FirestoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/admin", "/api/admin"})
public class AdminController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public AdminController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @PostMapping("/role")
    public ResponseEntity<?> assignRole(@RequestBody Map<String, String> request) {
        // Strict Backend Authorization Guard
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Admins can assign user roles"));
        }

        String uid = request.get("uid");
        String role = request.get("role");

        if (uid == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "UID and Role are required"));
        }

        Map<String, Object> userDoc = firestoreService.getDocument("users", uid);
        if (userDoc == null) {
            userDoc = new HashMap<>();
            userDoc.put("uid", uid);
            userDoc.put("email", uid + "@investmentcrm.com");
            userDoc.put("status", "ACTIVE");
        }

        String oldRole = (String) userDoc.getOrDefault("role", "USER");
        userDoc.put("role", role.toUpperCase());
        userDoc.put("updatedAt", Instant.now().toString());

        firestoreService.saveDocument("users", uid, userDoc);

        // Record Audit Log
        auditLogService.recordLog("ROLE_CHANGED", "USER", uid, "Role changed from " + oldRole + " to " + role.toUpperCase() + " by " + roleEvaluator.getCurrentUid());

        return ResponseEntity.ok(Map.of(
            "message", "Role updated successfully",
            "uid", uid,
            "role", role.toUpperCase()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        if (!roleEvaluator.isManagerOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Insufficient privilege to list users"));
        }
        List<Map<String, Object>> users = firestoreService.getAllDocuments("users");
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{uid}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable String uid, @RequestBody Map<String, String> body) {
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Admins can update user status"));
        }
        String status = body.get("status");
        Map<String, Object> userDoc = firestoreService.getDocument("users", uid);
        if (userDoc == null) return ResponseEntity.notFound().build();

        userDoc.put("status", status.toUpperCase());
        userDoc.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("users", uid, userDoc);

        auditLogService.recordLog("USER_STATUS_UPDATED", "USER", uid, "User status set to " + status.toUpperCase());
        return ResponseEntity.ok(userDoc);
    }

    @GetMapping("/branches")
    public ResponseEntity<?> getAllBranches() {
        List<Map<String, Object>> branches = firestoreService.getAllDocuments("branches");
        return ResponseEntity.ok(branches);
    }

    @PostMapping("/branches")
    public ResponseEntity<?> createBranch(@RequestBody Map<String, Object> branchData) {
        if (!roleEvaluator.isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Super Admin can create branches"));
        }
        String id = "BR-" + System.currentTimeMillis();
        branchData.put("id", id);
        branchData.put("createdAt", Instant.now().toString());
        firestoreService.saveDocument("branches", id, branchData);
        return ResponseEntity.ok(branchData);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Admins can view audit logs"));
        }
        List<Map<String, Object>> logs = firestoreService.getAllDocuments("auditLogs");
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/policy-categories-overview")
    public ResponseEntity<?> getPolicyCategoryOverview() {
        // Strict Backend Authorization Guard: Admin only (Manager ❌, Staff ❌)
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Access Denied: Only Admins can view Policy Category Overview"
            ));
        }

        List<Map<String, Object>> policies = firestoreService.getAllDocuments("policies");

        // Aggregation by category across all companies
        Map<String, Long> categoryCounts = new HashMap<>();
        Map<String, Map<String, Long>> companyCategoryCounts = new HashMap<>();

        for (Map<String, Object> p : policies) {
            String cat = (String) p.get("category");
            if (cat == null || cat.isBlank()) {
                cat = (String) p.get("type");
            }
            if (cat == null || cat.isBlank()) {
                cat = "General";
            }

            String company = (String) p.get("insuranceCompany");
            if (company == null || company.isBlank()) {
                company = (String) p.get("company");
            }
            if (company == null || company.isBlank()) {
                company = "General Provider";
            }

            categoryCounts.put(cat, categoryCounts.getOrDefault(cat, 0L) + 1L);

            companyCategoryCounts.putIfAbsent(company, new HashMap<>());
            Map<String, Long> compMap = companyCategoryCounts.get(company);
            compMap.put(cat, compMap.getOrDefault(cat, 0L) + 1L);
        }

        return ResponseEntity.ok(Map.of(
            "title", "Policy Category Overview",
            "totalPolicies", policies.size(),
            "categoryCounts", categoryCounts,
            "companyBreakdown", companyCategoryCounts
        ));
    }
}
