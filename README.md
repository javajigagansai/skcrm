# 🏆 SK Smart Investments – Enterprise Financial & Insurance CRM v2

> **Comprehensive End-to-End Enterprise CRM & Wealth Management System**  
> *Official Production Site:* [https://sk-crm-1.web.app](https://sk-crm-1.web.app)  
> *Official GitHub Repository:* [https://github.com/javajigagansai/skcrm](https://github.com/javajigagansai/skcrm)

---

## 📌 Executive Overview

**SK Smart Investments CRM v2** is a state-of-the-art, enterprise-grade Customer Relationship Management (CRM) and Wealth Management platform engineered specifically for financial advisors, insurance brokerages, and wealth management firms. 

The platform connects real-time database state across client onboarding, lead conversion pipelines, multi-line policy administration, mutual fund & fixed income portfolio tracking, automated policy renewal alerts, claim settlement SLA tracking, automated birthday/anniversary greeting engines, and confidential administrative financial ledgers.

---

## 🔑 Access Credentials & Official Logins

Use the following official credentials to test role-based permissions and access levels live on [https://sk-crm-1.web.app](https://sk-crm-1.web.app):

| Role / Account Type | Email Address | Password | Access Level & Workspace Scope |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin / Executive** | `admin@sk-smart-investments.com` | `Password@123` | **Full Unrestricted Access**: Executive Real-time Dashboard, Company Financial Ledger, Payroll, User Management, Audit Logs, Customer 360°, Claims Approval, System Settings. |
| 🏢 **Branch Manager** | `manager@sk-smart-investments.com` | `Password@123` | **Branch & Team Management**: Team Workload & Revenue Leaderboards, Claims Verification, Follow-ups, Income/Expense Registers, Branch Reports. |
| 💼 **Staff Advisor (Employee)** | `priya.sharma@sk-smart-investments.com` | `Password@123` | **Scoped Operations**: Scoped view of assigned client portfolios (*Priya Sharma*), policy issuing, mutual fund SIPs, customer interaction logs, claims filing. |

---

## 🛠️ Architecture & Technology Stack

The platform is architected with a decoupled frontend-backend model built for speed, real-time reactive UI updates, and enterprise security:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Vite + React 18 Frontend                │
                  │    Tailwind CSS • Lucide Icons • Recharts • jsPDF      │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                React Context API Layer                  │
                  │ AuthContext • DataContext • Customer360Context • Notif  │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
     ┌───────────────────────────────┐                 ┌───────────────────────────────┐
     │ Firebase Cloud Firestore DB   │                 │ Node.js / Express Backend     │
     │ Real-time collections & sync  │                 │ RESTful APIs • Audit Engine   │
     └───────────────────────────────┘                 └───────────────────────────────┘
```

### Core Technologies:
- **Frontend Framework**: React 18 with Vite build bundler
- **Styling & UI Design**: Modern Vanilla CSS + Tailwind CSS, Glassmorphism, Responsive Grid System
- **Icons & Visuals**: Lucide React Icon Suite
- **Data Visualization**: Recharts (Dynamic Bar, Line, Area, and Pie/Donut Charts)
- **Database & Authentication**: Firebase Authentication & Cloud Firestore Real-time Database
- **Backend Runtime**: Node.js, Express.js REST API Architecture
- **PDF Generation Engine**: jsPDF & html2canvas for instant client statement exports

---

## 👥 Master Role & Permissions Matrix

| Feature Module | Super Admin | Branch Manager | Staff Advisor |
| :--- | :---: | :---: | :---: |
| **Executive Real-time Dashboard** | ✅ All Firm Metrics | ✅ Branch View | ✅ Assigned Metrics |
| **Customer 360° Unified Drawer** | ✅ All Profiles | ✅ Team Profiles | ✅ Assigned Clients |
| **Lead Pipeline Management** | ✅ Full Access | ✅ Team Leads | ✅ Assigned Leads |
| **Insurance Policy Management** | ✅ Full Access | ✅ Branch Policies | ✅ Assigned Policies |
| **Investment Portfolio & AUM** | ✅ Full Access | ✅ Branch AUM | ✅ Assigned Portfolios |
| **Policy Renewals & Expiry** | ✅ Full Access | ✅ Team Renewals | ✅ Assigned Renewals |
| **Claims Filing & Settlement** | ✅ Approve / Reject | ✅ Verify / Process | ✅ File New Claims |
| **Staff Workload & Revenue Leaderboards** | ✅ Full View | ✅ Branch View | ✅ Visible |
| **Confidential Financial Ledger** | ✅ Full Access | ⚠️ Income / Expense | ❌ Restricted |
| **Special Days & Automated Greetings** | ✅ Full Engine | ✅ Team Greetings | ❌ Restricted |
| **User & Staff Management** | ✅ Full Access | ⚠️ Staff View | ❌ Restricted |
| **System Security & Audit Trail** | ✅ Complete Logs | ⚠️ Limited Audit | ❌ Restricted |

---

## 📌 Pin-to-Pin Feature Breakdown & Module Guide

### 1. 📊 Executive Real-Time Dashboard (`Dashboard.jsx`)
- **Real-Time Data Context**: Binds 100% to live `customers`, `leads`, `policies`, `investments`, `income`, `expenses`, `claims`, and `users` data.
- **Dynamic Chart 1: Monthly New Client Acquisitions & Policy Issuances**:
  - Displays client onboarding velocity and policy issuance numbers across **Today**, **This Month**, and **This Year**.
- **Dynamic Chart 2: Income vs Operational Expense Variance**:
  - Real-time comparison of gross commission revenue vs operational overheads and staff payroll outgo.
- **Dynamic Chart 3: Lead Conversion vs Claims Settlement Ratio (%)**:
  - Category-by-category breakdown across Health, Life, Mutual Funds, Motor, and Real Estate.
- **Dynamic Chart 4: Staff Advisor Targets vs Achieved**:
  - Visual ranking of staff advisors comparing target volume against achieved business Lakhs.
- **Dynamic Chart 5: Product Portfolio Share (%)**:
  - Donut chart representing portfolio asset allocation across Health, Life, SIP, FDs, and Real Estate.
- **Interactive Analytics Modals**: Click any chart card to view deep-dive tabular ledgers with PDF export options.

---

### 2. 👤 Customer 360° Profile System (`Customer360Drawer.jsx`)
- **Unified Client Hub**: Search any client to open a slide-over 360° drawer.
- **Demographics & Family Tree**: Displays primary client details, spouse, children, anniversary dates, and KYC verification status.
- **Linked Financial Assets**: Tabular view of all active insurance policies, mutual fund folios, fixed deposits, and real estate assets held by the client.
- **Claims & Follow-Up History**: Chronological history of filed claims, approval statuses, and advisor follow-up notes.

---

### 3. 🎯 Lead Management Pipeline (`Leads.jsx`)
- **Multi-Channel Intake**: Capture leads from website inquiries, phone calls, referral networks, and offline campaigns.
- **Status Progression Pipeline**:
  - `NEW` ➔ `QUALIFIED` ➔ `QUOTATION_SENT` ➔ `CALLBACK_SCHEDULED` ➔ `CONVERTED`.
- **Advisor Allocation**: Assign leads directly to staff members with automated workload balancing.
- **Quotation Generator**: Create instant insurance & SIP investment quotes.

---

### 4. 📜 Insurance Policy Administration (`Policies.jsx`)
- **Multi-Line Policy Register**: Supports Health Insurance, Term Life, ULIPs, Motor (Two-wheeler/Car), Commercial, and General Insurance.
- **Premium Computation**: Computes gross premium, net premium, GST component, and broker commission percentage.
- **Policy Document Storage**: Links policy numbers, insurer names, sum insured, start dates, and maturity dates.

---

### 5. 💰 Wealth & Investment Portfolio Management (`Investments.jsx`)
- **Asset Classes Supported**:
  - Mutual Funds (Monthly SIP & Lump-sum equity/hybrid/debt)
  - Fixed Deposits & Corporate Bonds
  - Real Estate & Gold Bullion holdings
- **AUM Valuation**: Dynamically calculates total Assets Under Management (AUM) per advisor and firm-wide.

---

### 6. 🔔 Policy Renewal Alerts & Expiry Tracking (`Renewals.jsx`)
- **Expiry Dashboard**: Displays policies due for renewal within 30 days, 15 days, and overdue policies.
- **Automated Reminders**: Trigger instant WhatsApp, SMS, or Email renewal notices to clients with pre-filled premium details.
- **Grace Period Monitoring**: Ensures clients never suffer a lapse in insurance coverage.

---

### 7. 🏥 Claims Filing & Settlement SLA (`Claims.jsx`)
- **End-to-End Tracking**: File claims with policy details, hospital/garage names, and claimed amount.
- **SLA Resolution Timer**: Monitors SLA completion target (Health: 2 Days, Motor: 3 Days, Life: 1 Day).
- **Approval Workflow**: Managers and Admins can update status to `SUBMITTED`, `UNDER_PROCESS`, `APPROVED`, or `PAID`.

---

### 8. 🎉 Special Days & Automated Greetings (`SpecialDays.jsx`)
- **Automated Wish Engine**: Automatically detects customer birthdays and wedding anniversaries occurring today.
- **Greeting Templates**: Pre-configured WhatsApp and Email templates.
- **Daily Execution Logs**: Tracks daily greetings completed per staff advisor.

---

### 9. 📈 Financial Ledger (Income & Expense Management) (`Income.jsx`, `Expenses.jsx`)
- **Commission Ledger**: Records incoming commission payments from insurance companies and AMC fund houses.
- **Operating Expenditure Ledger**: Tracks office rent, software subscriptions, infrastructure, marketing outgo, and employee salary expenses.
- **Net Operating Profit**: Real-time balance ledger subtracting total outgo from gross income.

---

### 10. 👥 Staff & User Management (`Users.jsx`, `StaffManagement.jsx`)
- **Staff Directory**: List of all registered staff advisors with phone numbers, emails, and roles.
- **Workload Leaderboard**: Monitors active vs completed clients per staff advisor.
- **Revenue Leaderboard**: Ranks staff members by business volume generated.

---

### 11. 🛡️ System Audit Logs & Security (`AuditLogs.jsx`)
- **Immutable Action Trail**: Logs every create, update, delete, login, and export action.
- **Metadata Captured**: Timestamp, User Email, Action Type, Target Record ID, and IP Address.

---

## 🗄️ Database Schemas & Data Structures

### 1. Customer Schema (`customers` Collection)
```json
{
  "id": "CUST-101",
  "customerCode": "SK-CUST-101",
  "name": "Rahul Sharma",
  "email": "rahul.sharma@example.com",
  "phone": "9876543210",
  "gender": "Male",
  "dob": "1988-05-14",
  "maritalStatus": "Married",
  "anniversaryDate": "2016-11-20",
  "city": "Chennai",
  "assignedAdvisorName": "Priya Sharma",
  "status": "Active"
}
```

### 2. Policy Schema (`policies` Collection)
```json
{
  "id": "POL-8821",
  "policyNumber": "POL-882190",
  "customerName": "Rahul Sharma",
  "insuranceCompany": "Star Health Insurance",
  "category": "Health Insurance",
  "grossPremium": 28500,
  "sumInsured": 1000000,
  "startDate": "2025-01-15",
  "expiryDate": "2026-01-14",
  "assignedStaff": "Priya Sharma",
  "status": "Active"
}
```

---

## 💻 Local Installation & Setup Guide

To run **SK Smart Investments CRM v2** on your local machine:

### Prerequisites:
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone Repository:
```bash
git clone https://github.com/javajigagansai/skcrm.git
cd skcrm
```

### 2. Install Dependencies:
```bash
cd frontend
npm install
```

### 3. Run Local Development Server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build Production Bundle:
```bash
npm run build
```

### 5. Deploy to Firebase Hosting:
```bash
cd ..
npx firebase deploy --only hosting
```

---

## 📦 GitHub Synchronization Commands

To push local code updates to the main branch:

```powershell
cd "c:\Users\V Saimanogna\Downloads\investment-crm-v2"
git add .
git commit -m "Update master project documentation and pin-to-pin system breakdown"
git push origin main
```

---

*Copyright © 2026 SK Smart Investments. All Rights Reserved.*
