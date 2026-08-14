package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDoc {
    private String uid;
    private String name;
    private String email;
    private String phone;
    private String role; // SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, VIEWER
    private String status; // ACTIVE, DISABLED
    private String branchId;
    private String createdAt;
    private String updatedAt;
    private String lastLogin;
}
