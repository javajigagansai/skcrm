package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDoc {
    private String id;
    private String title;
    private String description;
    private String assignedByUid;
    private String assignedByName;
    private String assignedToUid;
    private String assignedToName;
    private String dueDate;
    private String priority; // HIGH, MEDIUM, LOW
    private String status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    private String branchId;
    private String createdAt;
    private String updatedAt;
}
