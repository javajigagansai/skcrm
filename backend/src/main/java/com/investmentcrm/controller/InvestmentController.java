package com.investmentcrm.controller;

import com.investmentcrm.security.UserRoleEvaluator;
import com.investmentcrm.service.AuditLogService;
import com.investmentcrm.service.FirestoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public InvestmentController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllInvestments() {
        List<Map<String, Object>> investments = firestoreService.getAllDocuments("investments");
        return ResponseEntity.ok(investments);
    }

    @PostMapping
    public ResponseEntity<?> createInvestment(@RequestBody Map<String, Object> investmentData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot create investments"));
        }

        String id = "INV-2026-" + System.currentTimeMillis();
        investmentData.put("id", id);
        investmentData.put("investmentId", id);
        if (!investmentData.containsKey("status")) {
            investmentData.put("status", "PENDING"); // New investments default to PENDING approval
        }
        investmentData.put("advisorUid", roleEvaluator.getCurrentUid());
        investmentData.put("branchId", "BR-KNM-001");
        investmentData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("investments", id, investmentData);
        auditLogService.recordLog("INVESTMENT_CREATED", "INVESTMENT", id, "Created pending investment of " + investmentData.get("amount") + " for " + investmentData.get("customerName"));

        return ResponseEntity.ok(investmentData);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveInvestment(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        // Strict Backend Authorization Guard
        if (!roleEvaluator.isManagerOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Managers and Admins can approve investments"));
        }

        Map<String, Object> investment = firestoreService.getDocument("investments", id);
        if (investment == null) return ResponseEntity.notFound().build();

        investment.put("status", "ACTIVE");
        investment.put("approvedByUid", roleEvaluator.getCurrentUid());
        investment.put("approvedAt", Instant.now().toString());
        investment.put("updatedAt", Instant.now().toString());

        firestoreService.saveDocument("investments", id, investment);
        auditLogService.recordLog("INVESTMENT_APPROVED", "INVESTMENT", id, "Approved investment " + id + " for customer " + investment.get("customerName"));

        return ResponseEntity.ok(investment);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateInvestmentStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));

        if ("APPROVED".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status)) {
            if (!roleEvaluator.isManagerOrHigher()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Managers and Admins can approve/activate investments"));
            }
        }

        Map<String, Object> investment = firestoreService.getDocument("investments", id);
        if (investment == null) return ResponseEntity.notFound().build();

        investment.put("status", status.toUpperCase());
        investment.put("updatedAt", Instant.now().toString());

        firestoreService.saveDocument("investments", id, investment);
        auditLogService.recordLog("INVESTMENT_STATUS_CHANGED", "INVESTMENT", id, "Investment status set to " + status.toUpperCase());

        return ResponseEntity.ok(investment);
    }
}
