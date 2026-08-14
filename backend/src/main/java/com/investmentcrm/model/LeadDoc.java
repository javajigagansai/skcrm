package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDoc {
    private String id;
    private String customerName;
    private String email;
    private String phone;
    private String city;
    private String state;
    private String status; // NEW, CONTACTED, INTERESTED, MEETING_SCHEDULED, PROPOSAL, WON, LOST
    private String priority; // HIGH, MEDIUM, LOW
    private String assignedToUid;
    private String assignedToName;
    private String createdByUid;
    private String createdByName;
    private String branchId;
    private String dob;
    private String anniversaryDate;
    private List<Map<String, Object>> familyMembers;
    private String notes;
    private String createdAt;
    private String updatedAt;
}
