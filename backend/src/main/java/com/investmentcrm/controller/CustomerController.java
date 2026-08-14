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
@RequestMapping("/api/customers")
public class CustomerController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public CustomerController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllCustomers() {
        List<Map<String, Object>> customers = firestoreService.getAllDocuments("customers");
        String currentRole = roleEvaluator.getCurrentRole();
        
        // Admins and Managers retain full branch visibility
        if (roleEvaluator.isAdminOrHigher() || "MANAGER".equalsIgnoreCase(currentRole)) {
            return ResponseEntity.ok(customers);
        }

        // Staff roles filter to assigned clients
        String currentUser = roleEvaluator.getCurrentUserEmail();
        List<Map<String, Object>> scopedCustomers = customers.stream()
                .filter(c -> {
                    Object staff = c.get("assignedAdvisorName");
                    return staff == null || currentUser == null || staff.toString().equalsIgnoreCase(currentUser) || staff.toString().toLowerCase().contains(currentUser.toLowerCase());
                })
                .toList();

        return ResponseEntity.ok(scopedCustomers);
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, Object> customerData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot create customers"));
        }

        String id = "CUST-" + System.currentTimeMillis();
        customerData.put("id", id);
        customerData.put("customerCode", id);
        customerData.put("branchId", "BR-KNM-001");
        customerData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("customers", id, customerData);
        auditLogService.recordLog("CUSTOMER_CREATED", "CUSTOMER", id, "Created customer profile for " + customerData.get("name"));

        return ResponseEntity.ok(customerData);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable String id) {
        Map<String, Object> customer = firestoreService.getDocument("customers", id);
        if (customer == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable String id, @RequestBody Map<String, Object> customerData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot edit customers"));
        }
        Map<String, Object> existing = firestoreService.getDocument("customers", id);
        if (existing == null) return ResponseEntity.notFound().build();

        customerData.put("id", id);
        customerData.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("customers", id, customerData);

        auditLogService.recordLog("CUSTOMER_UPDATED", "CUSTOMER", id, "Updated customer details for " + customerData.get("name"));
        return ResponseEntity.ok(customerData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable String id) {
        if (!roleEvaluator.isAdminOrHigher()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Only Admins can delete customers"));
        }
        firestoreService.deleteDocument("customers", id);
        auditLogService.recordLog("CUSTOMER_DELETED", "CUSTOMER", id, "Deleted customer profile " + id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully", "id", id));
    }
}
