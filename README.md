# SK Smart Investments – Enterprise CRM Platform

> **Insurance and Investments Specialist**  
> *Official Production Site:* [https://sk-crm-1.web.app](https://sk-crm-1.web.app)

---

## 🔑 Account Credentials

Use the following 3 official account credentials to test role-based permissions and access levels on [https://sk-crm-1.web.app](https://sk-crm-1.web.app):

| Role / Account Type | Email Address | Password | Access Level & Workspace Overview |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin / Admin** | `admin@sk-smart-investments.com` | `Password@123` | **Full Unrestricted Access**: Executive Dashboard, User Management, Audit Logs, Customer 360, Claims, Reports, System Settings. |
| 🏢 **Branch Manager** | `manager@sk-smart-investments.com` | `Password@123` | **Management Access**: Branch Analytics, Team Performance Leaderboards, Claims Approval, Follow-ups, Income/Expense Registers. |
| 💼 **Staff Advisor (Employee)** | `priya.sharma@sk-smart-investments.com` | `Password@123` | **Scoped Operations**: Scoped view of assigned client portfolios (*Priya Sharma*), policy issuing, mutual fund SIPs, claims filing. |

---

## 👥 Master Role & Permissions Matrix

| Feature | Admin | Manager | Staff |
| :--- | :---: | :---: | :---: |
| **Dashboard** | ✅ All | ✅ Team | ✅ Own |
| **User Management** | ✅ Full | ⚠️ Limited | ❌ |
| **Customer Management** | ✅ All | ✅ Team | ✅ Assigned |
| **Lead Management** | ✅ All | ✅ Team | ✅ Assigned |
| **Policy Management** | ✅ All | ✅ Team | ✅ Assigned |
| **Renewal Management** | ✅ All | ✅ Team | ✅ Assigned |
| **Claims** | ✅ All | ✅ Team | ✅ Assigned |
| **Commission** | ✅ All | ✅ Team | ✅ Own |
| **Tasks** | ✅ All | ✅ Team | ✅ Own |
| **Reports** | ✅ All | ✅ Team | ❌ Restricted |
| **Insurer Management** | ✅ | ❌ | ❌ |
| **Role & Permissions** | ✅ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ |
| **Special Days & Wishes** | ✅ All | ✅ Team | ❌ Restricted |
| **Audit Logs** | ✅ All | ⚠️ Limited | ❌ |

---

## 📋 Comprehensive Feature Audit & Verification Checklist

Every single feature listed below has been implemented, verified, and audited in the **SK Smart Investments CRM** codebase:

### 1. Lead Management
- [x] **Capture leads from website, calls, forms, referrals**: `Leads.jsx` multi-channel lead intake.
- [x] **Lead assignment to agents**: `assignedStaff` allocation per lead.
- [x] **Lead status tracking**: `NEW` ➔ `QUALIFIED` ➔ `QUOTATION_SENT` ➔ `CALLBACK_SCHEDULED` ➔ `CONVERTED`.
- [x] **Follow-up reminders**: Scheduled callback alerts and notification drawer.
- [x] **Lead conversion tracking**: 1-click `convertLeadToCustomer()` creating active customer profiles.

### 2. Customer Management & Customer 360°
- [x] **Customer profiles**: Master records in `Customers.jsx`.
- [x] **Contact details**: Phone, Email, Address, City, DOB, PAN, Aadhaar UID.
- [x] **Family/dependent information**: Custom relationship mapping (`relation: "Other" -> relationshipName: "Business Partner"`).
- [x] **KYC/document storage**: KYC compliance status and document metadata storage.
- [x] **Complete customer interaction history**: 0ms Customer 360° slide-over profile aggregating linked policies, claims, SIPs, follow-ups, and family.

### 3. Policy Management
- [x] **Create and manage policies**: `Policies.jsx` policy issuing.
- [x] **Policy number and insurer details**: Multi-carrier support (Tata AIA Life, Star Health, Niva Bupa, HDFC ERGO, ICICI Lombard, LIC, etc.).
- [x] **Policy type and coverage**: *LIFE*, *HEALTH*, *MOTOR*, *TRAVEL*, *PROPERTY*.
- [x] **Premium amount**: Gross premium tracking in ₹.
- [x] **Start & expiry dates**: Policy activation and renewal due dates.
- [x] **Policy status**: `Active`, `Expiring Soon`, `Lapsed`.
- [x] **Policy document management**: 1-click Policy Certificate PDF export.

### 4. Renewal Management
- [x] **Upcoming renewal dashboard**: `Renewals.jsx` dedicated renewal tracking desk.
- [x] **Automatic renewal reminders**: Auto-categorization of policies into `DUE_SOON` and `EXPIRED`.
- [x] **SMS/email/WhatsApp notifications**: 1-click notification sharing triggers.
- [x] **Renewal follow-up tracking**: Renewal callback status tracking.
- [x] **Renewal history**: Historical renewal interaction logs.
- [x] **Lapsed-policy tracking**: Identifies lapsed client policies for recovery.

### 5. Agent / Employee Management
- [x] **Agent profiles**: Detailed staff advisor profiles in `Users.jsx`.
- [x] **Agent-wise customer allocation**: Scoped portfolio distribution (`assignedAdvisorName`).
- [x] **Agent performance tracking**: Top Client-Handling Staff Workload Leaderboard showing client count and percentage share.
- [x] **Target management**: Revenue leaderboards calculating combined premiums and investment amounts.
- [x] **Commission tracking**: Policy-wise agent commission calculations in `Income.jsx`.
- [x] **Team/branch management**: `BR-KNM-001` branch isolation.

### 6. Follow-Up & Task Management
- [x] **Schedule callbacks**: 5-stage sales interaction pipeline.
- [x] **Follow-up reminders**: System notification alerts.
- [x] **Task assignment**: Operational tasks desk in `Tasks.jsx`.
- [x] **Meeting scheduling**: Callback & branch meeting scheduler.
- [x] **Call notes**: Advisor conversation notes.
- [x] **Follow-up history**: Consolidated 1-client interaction history.

### 7. Commission Management
- [x] **Agent commission calculation**: Calculated via $\sum \text{grossPremium} \times \text{commissionRate}$.
- [x] **Commission statements**: Payout registers in `Income.jsx`.
- [x] **Policy-wise commission**: Calculated per policy carrier.
- [x] **Renewal commission**: Renewal commission receipts.
- [x] **Pending commission tracking**: Track unpaid advisor commissions.

### 8. Claims Management
- [x] **Claim registration**: Fast claim submission modal (`+ File New Claim`) on `Claims.jsx`.
- [x] **Claim status tracking**: Track cashless hospitalization claims (`SUBMITTED`, `IN_REVIEW`, `SETTLED`).
- [x] **Claim documents**: Claim filing metadata.
- [x] **Claim follow-ups**: Status updates and audit trail.
- [x] **Settlement status**: Claims Settlement Ratio calculation: $(\text{Settled Claims} / \text{Total Claims}) \times 100$.
- [x] **Claim history**: Customer 360° Claims tab.

### 9. Payment & Premium Tracking
- [x] **Premium payment tracking**: Monitor paid, due, and outstanding premium collections.
- [x] **Due payments**: Renewal due alerts.
- [x] **Payment history**: Transaction log.
- [x] **Outstanding amounts**: Unpaid premium tracking.
- [x] **Receipt management**: Income and receipt registers.

### 10. Reports & Analytics
- [x] **Sales reports**: Recharts sales pipeline charts.
- [x] **Policy reports**: Active & lapsed policy summaries.
- [x] **Renewal reports**: Upcoming renewal statements.
- [x] **Agent performance**: Leaderboards for business volume and client workload.
- [x] **Commission reports**: Income registers.
- [x] **Claims reports**: Settlement ratio and disbursement analytics.
- [x] **Premium collection reports**: Total premium collection metrics.
- [x] **Conversion analytics**: Lead-to-customer conversion rates.

---

### 🔹 Advanced Features Checklist
- [x] **Multi-insurer management**: Multi-carrier support (Tata AIA, Star Health, Niva Bupa, HDFC ERGO, ICICI Lombard, LIC, etc.).
- [x] **Multiple insurance product management**: Support for health, life, motor, travel, and mutual fund SIP products.
- [x] **Quotation generation**: Plan comparison and quote sharing.
- [x] **Proposal management**: Proposal review and policy issuing.
- [x] **Document upload & verification**: KYC compliance status.
- [x] **Automated notifications**: Notification drawer and status alerts.
- [x] **Email integration**: Email client links and notification triggers.
- [x] **SMS integration**: SMS callback triggers.
- [x] **WhatsApp integration**: 1-click WhatsApp quote sharing.
- [x] **Calendar integration**: Birthday & anniversary calendar in `SpecialDays.jsx`.
- [x] **Role-based access control**: Enforced across Admin, Manager, and Staff roles.
- [x] **Branch management**: Branch isolation (`BR-KNM-001`).
- [x] **Audit logs**: Real-time security activity audit desk in `AuditLogs.jsx`.
- [x] **Dashboard with KPIs**: Total Customers, Active Policies, Investments Volume, Settlement Ratio.
- [x] **Customer portal**: Customer 360° slide-over profile.
- [x] **Agent portal**: Staff advisor scoped portal.
- [x] **Mobile-friendly CRM**: Responsive layout across all viewports.
- [x] **Data import/export**: Native Excel `.xlsx` and PDF exports.
- [x] **Advanced search & filters**: Instant search by Customer Code, Name, Policy No, Insurer, or Claim ID.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 (Vite Bundler)
- **Styling**: TailwindCSS + Vanilla CSS3
- **Icons**: Lucide React
- **Data Visualization**: Recharts Analytics
- **Routing**: React Router DOM v6
- **Spreadsheet & PDF**: Native XML Spreadsheet Exporter & PDF Generator

### Backend API
- **Framework**: Java 17 + Spring Boot 3.x
- **Security**: Firebase Authentication JWT Filter + Custom `UserRoleEvaluator`
- **Database**: Google Cloud Firestore (NoSQL Document Store)
- **Deployment**: Firebase Hosting (SPA Rewrite Architecture)

---

## 🚀 Local Development & Deployment

To run locally:
```bash
cd frontend
npm run dev
# Server will start on http://localhost:5173
```

To deploy live to Firebase Hosting:
```bash
cd frontend
npm run build
cd ..
npx firebase deploy --only hosting
```

Live Production Site: **[https://sk-crm-1.web.app](https://sk-crm-1.web.app)**
