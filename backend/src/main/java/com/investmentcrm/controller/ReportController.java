package com.investmentcrm.controller;

import com.investmentcrm.service.FirestoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final FirestoreService firestoreService;

    public ReportController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getReportSummary(
            @RequestParam(required = false, defaultValue = "MONTHLY") String period,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) String advisorUid) {

        List<Map<String, Object>> customers = firestoreService.getAllDocuments("customers");
        List<Map<String, Object>> leads = firestoreService.getAllDocuments("leads");
        List<Map<String, Object>> investments = firestoreService.getAllDocuments("investments");
        List<Map<String, Object>> income = firestoreService.getAllDocuments("income");
        List<Map<String, Object>> expenses = firestoreService.getAllDocuments("expenses");
        List<Map<String, Object>> tasks = firestoreService.getAllDocuments("tasks");

        double totalInvestmentVolume = investments.stream()
                .mapToDouble(i -> i.get("amount") != null ? Double.parseDouble(i.get("amount").toString()) : 0.0)
                .sum();

        double totalIncomeVolume = income.stream()
                .mapToDouble(inc -> inc.get("amount") != null ? Double.parseDouble(inc.get("amount").toString()) : 0.0)
                .sum();

        double totalExpenseVolume = expenses.stream()
                .mapToDouble(exp -> exp.get("amount") != null ? Double.parseDouble(exp.get("amount").toString()) : 0.0)
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("period", period);
        summary.put("totalCustomers", customers.size());
        summary.put("totalActiveLeads", leads.size());
        summary.put("totalInvestmentsCount", investments.size());
        summary.put("totalInvestmentVolume", totalInvestmentVolume);
        summary.put("totalIncomeVolume", totalIncomeVolume);
        summary.put("totalExpenseVolume", totalExpenseVolume);
        summary.put("netProfit", totalIncomeVolume - totalExpenseVolume);
        summary.put("pendingTasksCount", tasks.stream().filter(t -> "PENDING".equals(t.get("status"))).count());

        return ResponseEntity.ok(summary);
    }
}
