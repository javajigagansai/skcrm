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
public class CustomerDoc {
    private String id;
    private String customerCode;
    private String name;
    private String email;
    private String phone;
    private String pan;
    private String aadhaar;
    private String address;
    private String city;
    private String state;
    private String nomineeName;
    private String nomineeRelation;
    private String branchId;
    private String assignedAdvisorUid;
    private String assignedAdvisorName;
    private String convertedFromLeadId;
    private List<Map<String, Object>> familyMembers;
    private String notes;
    private String createdAt;
    private String updatedAt;
}
