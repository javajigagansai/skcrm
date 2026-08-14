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
@RequestMapping("/api/tasks")
public class TaskController {

    private final FirestoreService firestoreService;
    private final AuditLogService auditLogService;
    private final UserRoleEvaluator roleEvaluator;

    public TaskController(FirestoreService firestoreService, AuditLogService auditLogService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.auditLogService = auditLogService;
        this.roleEvaluator = roleEvaluator;
    }

    @GetMapping
    public ResponseEntity<?> getAllTasks() {
        List<Map<String, Object>> tasks = firestoreService.getAllDocuments("tasks");
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> taskData) {
        if ("VIEWER".equalsIgnoreCase(roleEvaluator.getCurrentRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Read-only viewers cannot create tasks"));
        }

        String id = "TSK-2026-" + System.currentTimeMillis();
        taskData.put("id", id);
        if (!taskData.containsKey("status")) {
            taskData.put("status", "PENDING");
        }
        if (!taskData.containsKey("priority")) {
            taskData.put("priority", "MEDIUM");
        }
        taskData.put("assignedByUid", roleEvaluator.getCurrentUid());
        taskData.put("branchId", "BR-KNM-001");
        taskData.put("createdAt", Instant.now().toString());

        firestoreService.saveDocument("tasks", id, taskData);
        auditLogService.recordLog("TASK_CREATED", "TASK", id, "Created task: " + taskData.get("title"));

        return ResponseEntity.ok(taskData);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Map<String, Object> task = firestoreService.getDocument("tasks", id);
        if (task == null) return ResponseEntity.notFound().build();

        task.put("status", status.toUpperCase());
        task.put("updatedAt", Instant.now().toString());
        firestoreService.saveDocument("tasks", id, task);

        auditLogService.recordLog("TASK_STATUS_UPDATED", "TASK", id, "Task " + id + " status set to " + status.toUpperCase());
        return ResponseEntity.ok(task);
    }
}
