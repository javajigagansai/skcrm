package com.investmentcrm.controller;

import com.investmentcrm.security.UserRoleEvaluator;
import com.investmentcrm.service.AuditLogService;
import com.investmentcrm.service.FirestoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public LeadController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllLeads() {
        List<Map<String, Object>> leads = firestoreService.getAllDocuments("leads");
        return ResponseEntity.ok(leads);
    }

    @PostMapping
    public ResponseEntity<?> createLead(@RequestBody Map<String, Object> leadData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot create leads"));
        }

        String id = "LD-2026-" + System.currentTimeMillis();
        leadData.put("id", id);
        if (!leadData.containsKey("status")) {
            leadData.put("status", "NEW");
        }
        if (!leadData.containsKey("priority")) {
            leadData.put("priority", "MEDIUM");
        }
        leadData.put("createdByUid", roleEvaluator.getCurrentUid());
        leadData.put("branchId", "BR-KNM-001");
        leadData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("leads", id, leadData);
        auditLogService.recordLog("LEAD_CREATED", "LEAD", id, "Created lead for " + leadData.get("customerName"));

        return ResponseEntity.ok(leadData);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLead(@PathVariable String id, @RequestBody Map<String, Object> leadData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot edit leads"));
        }
        Map<String, Object> existing = firestoreService.getDocument("leads", id);
        if (existing == null) return ResponseEntity.notFound().build();

        leadData.put("id", id);
        leadData.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("leads", id, leadData);

        auditLogService.recordLog("LEAD_UPDATED", "LEAD", id, "Updated lead details for " + leadData.get("customerName"));
        return ResponseEntity.ok(leadData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLead(@PathVariable String id) {
        if (!roleEvaluator.isManagerOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Managers and Admins can delete leads"));
        }
        firestoreService.deleteDocument("leads", id);
        auditLogService.recordLog("LEAD_DELETED", "LEAD", id, "Deleted lead record " + id);
        return ResponseEntity.ok(Map.of("message", "Lead deleted successfully", "id", id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateLeadStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Map<String, Object> lead = firestoreService.getDocument("leads", id);
        if (lead == null) return ResponseEntity.notFound().build();

        lead.put("status", status.toUpperCase());
        lead.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("leads", id, lead);

        auditLogService.recordLog("LEAD_STATUS_CHANGED", "LEAD", id, "Lead status updated to " + status.toUpperCase());
        return ResponseEntity.ok(lead);
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertLeadToCustomer(@PathVariable String id) {
        Map<String, Object> lead = firestoreService.getDocument("leads", id);
        if (lead == null) return ResponseEntity.notFound().build();

        // 1. Mark lead as WON
        lead.put("status", "WON");
        lead.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("leads", id, lead);

        // 2. Generate Customer Record in Firestore
        String customerId = "CUST-" + System.currentTimeMillis();
        Map<String, Object> customer = new HashMap<>();
        customer.put("id", customerId);
        customer.put("customerCode", customerId);
        customer.put("name", lead.get("customerName"));
        customer.put("email", lead.get("email"));
        customer.put("phone", lead.get("phone"));
        customer.put("city", lead.get("city"));
        customer.put("state", lead.get("state"));
        customer.put("convertedFromLeadId", id);
        customer.put("assignedAdvisorUid", lead.get("assignedToUid"));
        customer.put("assignedAdvisorName", lead.get("assignedToName"));
        customer.put("branchId", "BR-KNM-001");
        customer.put("familyMembers", lead.get("familyMembers"));
        customer.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("customers", customerId, customer);
        auditLogService.recordLog("LEAD_CONVERTED", "CUSTOMER", customerId, "Converted lead " + id + " into new customer " + customerId);

        return ResponseEntity.ok(Map.of(
            "message", "Lead converted successfully to Customer",
            "leadId", id,
            "customerId", customerId,
            "customer", customer
        ));
    }
}
