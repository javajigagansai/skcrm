package com.investmentcrm.service;

import com.investmentcrm.model.AuditLogDoc;
import com.investmentcrm.security.UserRoleEvaluator;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogService {

    private final FirestoreService firestoreService;
    private final UserRoleEvaluator roleEvaluator;

    public AuditLogService(FirestoreService firestoreService, UserRoleEvaluator roleEvaluator) {
        this.firestoreService = firestoreService;
        this.roleEvaluator = roleEvaluator;
    }

    public void recordLog(String action, String entityType, String entityId, String details) {
        String logId = "AUD-" + System.currentTimeMillis();
        String actorUid = roleEvaluator.getCurrentUid();
        String actorRole = roleEvaluator.getCurrentRole();

        Map<String, Object> logDoc = new HashMap<>();
        logDoc.put("id", logId);
        logDoc.put("actorUid", actorUid);
        logDoc.put("actorRole", actorRole);
        logDoc.put("action", action);
        logDoc.put("entityType", entityType);
        logDoc.put("entityId", entityId);
        logDoc.put("details", details);
        logDoc.put("branchId", "BR-KNM-001");
        logDoc.put("timestamp", Instant.now().toString());

        firestoreService.saveDocument("auditLogs", logId, logDoc);
    }
}
