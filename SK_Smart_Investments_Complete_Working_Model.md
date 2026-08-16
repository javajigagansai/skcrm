# 🏆 SK Smart Investments – Complete Working Model & System Architecture

> **Complete Master Reference & Pin-to-Pin System Documentation**  
> *Live Site:* [https://sk-crm-1.web.app](https://sk-crm-1.web.app)  
> *GitHub Repository:* [https://github.com/javajigagansai/skcrm](https://github.com/javajigagansai/skcrm)

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Live Credentials & Access Control](#2-live-credentials--access-control)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Master Permissions & Role Matrix](#4-master-permissions--role-matrix)
5. [Pin-to-Pin Module Breakdown](#5-pin-to-pin-module-breakdown)
   - [5.1 Executive Real-Time Dashboard](#51-executive-real-time-dashboard)
   - [5.2 Unified Customer 360° Profile Drawer](#52-unified-customer-360-profile-drawer)
   - [5.3 Lead Conversion Pipeline](#53-lead-conversion-pipeline)
   - [5.4 Insurance Policy Administration](#54-insurance-policy-administration)
   - [5.5 Investment & Wealth Management](#55-investment--wealth-management)
   - [5.6 Expiry & Renewal Reminders](#56-expiry--renewal-reminders)
   - [5.7 Claims Filing & Settlement SLA](#57-claims-filing--settlement-sla)
   - [5.8 Automated Greetings & Special Days Engine](#58-automated-greetings--special-days-engine)
   - [5.9 Financial Ledger & Payroll Spend](#59-financial-ledger--payroll-spend)
   - [5.10 Staff Management & Workload Leaderboards](#510-staff-management--workload-leaderboards)
   - [5.11 Audit Trail & Security](#511-audit-trail--security)
6. [Database Schema Reference](#6-database-schema-reference)
7. [Deployment & GitHub Push Guide](#7-deployment--github-push-guide)

---

## 1. Executive Summary & Purpose

**SK Smart Investments CRM v2** is a enterprise-grade CRM solution tailored for insurance agencies, financial advisory practices, and wealth management firms. It streamlines client management, multi-product insurance policy issuance, mutual fund SIP allocations, claims settlement tracking, automated birthday/anniversary greeting engines, and administrative financial auditing.

---

## 2. Live Credentials & Access Control

Official live production site: **[https://sk-crm-1.web.app](https://sk-crm-1.web.app)**

| Role / Account Type | Email | Password | Access Rights & Scope |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `admin@sk-smart-investments.com` | `Password@123` | **Full Unrestricted Access**: Dashboard, Financial Ledger, Payroll, User Management, Audit Logs, Customer 360°, Claims Approval. |
| 🏢 **Branch Manager** | `manager@sk-smart-investments.com` | `Password@123` | **Branch & Team Scope**: Team Performance Leaderboards, Claims Verification, Follow-ups, Income/Expense Registers. |
| 💼 **Staff Advisor** | `priya.sharma@sk-smart-investments.com` | `Password@123` | **Scoped Operations**: Assigned client portfolio (*Priya Sharma*), policy issuing, mutual fund SIPs, customer interaction logs, claims filing. |

---

## 3. System Architecture & Data Flow

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            React 18 Single Page App                     │
 │              Vite • Tailwind CSS • Lucide Icons • Recharts • jsPDF      │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           Context API Layer                             │
 │      AuthContext • DataContext • Customer360Context • Notification      │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
 ┌───────────────────────────────┐         ┌───────────────────────────────┐
 │ Firebase Cloud Firestore DB   │         │ Node.js Express REST Engine   │
 │ Real-time collections & sync  │         │ Audit Engine & Report APIs    │
 └───────────────────────────────┘         └───────────────────────────────┘
```

---

## 4. Master Permissions & Role Matrix

| Module | Super Admin | Branch Manager | Staff Advisor |
| :--- | :---: | :---: | :---: |
| **Real-time Dashboard** | ✅ All Firm Data | ✅ Branch View | ✅ Assigned Metrics |
| **Customer 360° Drawer** | ✅ All Clients | ✅ Team Clients | ✅ Assigned Clients |
| **Lead Pipeline** | ✅ Full Access | ✅ Team Leads | ✅ Assigned Leads |
| **Insurance Policies** | ✅ Full Access | ✅ Branch View | ✅ Assigned View |
| **Investments & AUM** | ✅ Full Access | ✅ Branch AUM | ✅ Assigned Portfolios |
| **Policy Renewals** | ✅ Full Access | ✅ Team Renewals | ✅ Assigned Renewals |
| **Claims Filing** | ✅ Approve / Reject | ✅ Verify / Process | ✅ File New Claims |
| **Leaderboards** | ✅ Full View | ✅ Branch View | ✅ Visible |
| **Financial Ledger** | ✅ Full Access | ⚠️ Income/Expense | ❌ Restricted |
| **Special Days Wisher** | ✅ Full Engine | ✅ Team Engine | ❌ Restricted |
| **User & Staff Mgmt** | ✅ Full Access | ⚠️ Staff View | ❌ Restricted |
| **Audit Trail Logs** | ✅ Complete Trail | ⚠️ Limited Audit | ❌ Restricted |

---

## 5. Pin-to-Pin Module Breakdown

### 5.1 Executive Real-Time Dashboard (`Dashboard.jsx`)
- Binds 100% to live context state (`customers`, `leads`, `policies`, `investments`, `income`, `expenses`, `claims`, `users`).
- **5 Dynamic Recharts Graphs**:
  1. Client Acquisitions & Policy Issuances Velocity Chart
  2. Income vs Operational Expense Variance Bar & Area Chart
  3. Lead Conversion vs Claims Settlement % Chart
  4. Staff Advisor Targets vs Achieved Bar Chart
  5. Product Portfolio Allocation Donut Chart
- Interactive modals with deep-dive tabular detail views and instant PDF report export.

### 5.2 Unified Customer 360° Profile Drawer (`Customer360Drawer.jsx`)
- Slide-over drawer providing a single view of customer demographics, family tree members, active insurance policies, mutual fund folios, claim records, and interaction timelines.

### 5.3 Lead Conversion Pipeline (`Leads.jsx`)
- Multi-channel lead capture engine.
- 5-Stage Status Progression: `NEW` ➔ `QUALIFIED` ➔ `QUOTATION_SENT` ➔ `CALLBACK_SCHEDULED` ➔ `CONVERTED`.
- Advisor workload assignment.

### 5.4 Insurance Policy Administration (`Policies.jsx`)
- Manages Health, Term Life, ULIP, Motor, Commercial, and General Insurance policies.
- Automatically calculates gross premium, net premium, GST, and broker commission.

### 5.5 Investment & Wealth Management (`Investments.jsx`)
- Manages Mutual Funds (SIP & Lump Sum), Fixed Deposits, Government Bonds, and Real Estate holdings.
- Real-time valuation of total Assets Under Management (AUM).

### 5.6 Expiry & Renewal Reminders (`Renewals.jsx`)
- Expiry timeline tracker (30-day, 15-day, overdue alerts).
- One-click WhatsApp, SMS, and Email renewal dispatch with pre-filled premium values.

### 5.7 Claims Filing & Settlement SLA (`Claims.jsx`)
- End-to-end claim registration and hospital/garage routing.
- Monitors SLA targets (Health: 2 Days, Motor: 3 Days, Life: 1 Day).

### 5.8 Automated Greetings & Special Days Engine (`SpecialDays.jsx`)
- Birthday and wedding anniversary detector.
- Personalized WhatsApp and Email greeting execution logs.

### 5.9 Financial Ledger & Payroll Spend (`Income.jsx`, `Expenses.jsx`)
- Commission income tracking from insurance companies and AMC fund houses.
- Overhead expenses, rent, marketing, software, and staff salary spend ledger.

### 5.10 Staff Management & Workload Leaderboards (`StaffManagement.jsx`)
- Revenue Leaderboard (Ranks staff by business volume).
- Workload Leaderboard (Tracks active vs completed client accounts).

### 5.11 Audit Trail & Security (`AuditLogs.jsx`)
- Logs user activity: Action Name, Target Resource, User Email, Timestamp, and IP Address.

---

## 6. Database Schema Reference

```json
{
  "customers": {
    "id": "CUST-101",
    "name": "Rahul Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "9876543210",
    "city": "Chennai",
    "assignedAdvisorName": "Priya Sharma",
    "status": "Active"
  },
  "policies": {
    "id": "POL-8821",
    "policyNumber": "POL-882190",
    "customerName": "Rahul Sharma",
    "category": "Health Insurance",
    "grossPremium": 28500,
    "sumInsured": 1000000,
    "assignedStaff": "Priya Sharma"
  }
}
```

---

## 7. Deployment & GitHub Push Guide

To push updates and deploy live:

```powershell
# 1. Build & Deploy to Firebase Hosting
cd "c:\Users\V Saimanogna\Downloads\investment-crm-v2\frontend" ; npm run build ; cd .. ; npx firebase deploy --only hosting

# 2. Push to GitHub Repository
cd "c:\Users\V Saimanogna\Downloads\investment-crm-v2" ; git add . ; git commit -m "Complete working model and pin-to-pin documentation sync" ; git push origin main
```

---

*Copyright © 2026 SK Smart Investments. All Rights Reserved.*
