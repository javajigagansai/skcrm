package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDoc {
    private String id;
    private String name;
    private String code;
    private String city;
    private String state;
    private String address;
    private String phone;
    private String email;
    private String status; // ACTIVE
    private String createdAt;
}
