package com.investmentcrm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDoc {
    private String id;
    private String category; // Salary, Rent, Electricity, Internet, Fuel, Marketing, Office Supplies, Miscellaneous
    private String description;
    private double amount;
    private String expenseDate;
    private String recordedByUid;
    private String branchId;
    private String createdAt;
}
