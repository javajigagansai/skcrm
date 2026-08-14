package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentDoc {
    private String id;
    private String investmentId;
    private String customerId;
    private String customerName;
    private String advisorUid;
    private String advisorName;
    private String type; // SIP, Mutual Fund, Fixed Deposit, Insurance, Stocks, Bonds, Gold, Real Estate
    private double amount;
    private int durationMonths;
    private double interestRate;
    private double currentValue;
    private String maturityDate;
    private String status; // PENDING, APPROVED, ACTIVE, COMPLETED, CLOSED
    private String approvedByUid;
    private String approvedByName;
    private String approvedAt;
    private String branchId;
    private String createdAt;
    private String updatedAt;
}
