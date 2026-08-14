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
@RequestMapping("/api/income")
public class IncomeController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public IncomeController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllIncome() {
        List<Map<String, Object>> incomeList = firestoreService.getAllDocuments("income");
        return ResponseEntity.ok(incomeList);
    }

    @PostMapping
    public ResponseEntity<?> createIncome(@RequestBody Map<String, Object> incomeData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot record income"));
        }

        String id = "INC-2026-" + System.currentTimeMillis();
        incomeData.put("id", id);
        incomeData.put("incomeId", id);
        if (!incomeData.containsKey("status")) {
            incomeData.put("status", "RECEIVED");
        }
        incomeData.put("recordedByUid", roleEvaluator.getCurrentUid());
        incomeData.put("branchId", "BR-KNM-001");
        incomeData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("income", id, incomeData);
        auditLogService.recordLog("INCOME_CREATED", "INCOME", id, "Recorded income of " + incomeData.get("amount") + " (" + incomeData.get("incomeType") + ")");

        return ResponseEntity.ok(incomeData);
    }
}
