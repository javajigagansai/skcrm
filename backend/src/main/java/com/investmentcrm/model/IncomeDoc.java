package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeDoc {
    private String id;
    private String incomeId;
    private String investmentId;
    private String customerId;
    private String customerName;
    private double amount;
    private String incomeType; // COMMISSION, BROKERAGE, INTEREST, DIVIDEND, PROFIT_SHARE, CONSULTATION_FEE
    private String receivedDate;
    private String status; // PENDING, RECEIVED, CANCELLED
    private String recordedByUid;
    private String branchId;
    private String createdAt;
}
