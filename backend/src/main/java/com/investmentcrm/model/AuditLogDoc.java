package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDoc {
    private String id;
    private String actorUid;
    private String actorName;
    private String actorRole;
    private String action; // USER_CREATED, ROLE_CHANGED, LEAD_CREATED, LEAD_CONVERTED, INVESTMENT_APPROVED, INCOME_CREATED, EXPENSE_CREATED, TASK_CREATED
    private String entityType;
    private String entityId;
    private String details;
    private String branchId;
    private String timestamp;
}
