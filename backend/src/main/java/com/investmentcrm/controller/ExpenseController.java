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
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public ExpenseController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllExpenses() {
        List<Map<String, Object>> expenses = firestoreService.getAllDocuments("expenses");
        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> expenseData) {
        if (!roleEvaluator.isAdminOrHigher() && !"MANAGER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Managers and Admins can record expenses"));
        }

        String id = "EXP-2026-" + System.currentTimeMillis();
        expenseData.put("id", id);
        expenseData.put("recordedByUid", roleEvaluator.getCurrentUid());
        expenseData.put("branchId", "BR-KNM-001");
        expenseData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("expenses", id, expenseData);
        auditLogService.recordLog("EXPENSE_CREATED", "EXPENSE", id, "Recorded expense of " + expenseData.get("amount") + " (" + expenseData.get("category") + ")");

        return ResponseEntity.ok(expenseData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable String id) {
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Admins can delete expense records"));
        }
        firestoreService.deleteDocument("expenses", id);
        auditLogService.recordLog("EXPENSE_DELETED", "EXPENSE", id, "Deleted expense record " + id);
        return ResponseEntity.ok(Map.of("message", "Expense deleted successfully", "id", id));
    }
}
