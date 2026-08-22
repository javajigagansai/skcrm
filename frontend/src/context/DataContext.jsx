import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { filterScopedRecords, canAccessCustomer } from '../utils/rbac';
import { 
  fetchCustomersBackend, createCustomerBackend, updateCustomerBackend, deleteCustomerBackend,
  fetchLeadsBackend, createLeadBackend, updateLeadBackend, deleteLeadBackend,
  fetchInvestmentsBackend, createInvestmentBackend,
  fetchIncomeBackend, createIncomeBackend,
  fetchExpensesBackend, createExpenseBackend,
  fetchTasksBackend, createTaskBackend
} from '../services/apiService';
import { db } from '../config/firebaseClient';
import { collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext();

const initialCustomersSeed = [
  {
    id: 'CUST-101',
    customerCode: 'SK-CUST-101',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876543210',
    mobileNumber: '9876543210',
    gender: 'Male',
    dob: '1988-05-14',
    maritalStatus: 'Married',
    anniversaryDate: '2016-11-20',
    city: 'Chennai',
    address: '42 MG Road, Nungambakkam, Chennai',
    pan: 'ABCDE1234F',
    aadhaar: '9920-4819-1234',
    occupation: 'Software Architect',
    incomeBracket: '₹ 25L - ₹ 50L',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedAdvisorName: 'Priya Sharma',
    assignedStaffEmail: 'priya.sharma@sk-smart-investments.com',
    branchId: 'BR-KNM-001',
    status: 'Active',
    familyMembers: [
      { id: 'FM-1', name: 'Neha Sharma', relation: 'Spouse', gender: 'Female', dob: '1990-08-22', anniversaryDate: '2016-11-20', phone: '9876543211' },
      { id: 'FM-2', name: 'Aarav Sharma', relation: 'Son', gender: 'Male', dob: '2018-03-10', anniversaryDate: '', phone: '' }
    ]
  },
  {
    id: 'CUST-102',
    customerCode: 'SK-CUST-102',
    name: 'Priya Menon',
    email: 'priya.menon@example.com',
    phone: '9812345678',
    mobileNumber: '9812345678',
    gender: 'Female',
    dob: '1992-12-05',
    maritalStatus: 'Single',
    anniversaryDate: '',
    city: 'Bangalore',
    address: '12 Indiranagar 100ft Road, Bangalore',
    pan: 'PQRSW9876K',
    aadhaar: '8812-3341-9012',
    occupation: 'Senior Product Manager',
    incomeBracket: '₹ 15L - ₹ 25L',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedAdvisorName: 'Priya Sharma',
    assignedStaffEmail: 'priya.sharma@sk-smart-investments.com',
    branchId: 'BR-KNM-001',
    status: 'Active',
    familyMembers: []
  },
  {
    id: 'CUST-103',
    customerCode: 'SK-CUST-103',
    name: 'Anand Kumar',
    email: 'anand.kumar@example.com',
    phone: '9988776655',
    mobileNumber: '9988776655',
    gender: 'Male',
    dob: '1982-03-18',
    maritalStatus: 'Married',
    anniversaryDate: '2010-04-15',
    city: 'Hyderabad',
    address: '88 Jubilee Hills, Hyderabad',
    pan: 'KLMNO5678Z',
    aadhaar: '7765-4432-1100',
    occupation: 'Business Owner',
    incomeBracket: '₹ 50L - ₹ 1Cr',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedAdvisorName: 'Priya Sharma',
    assignedStaffEmail: 'priya.sharma@sk-smart-investments.com',
    branchId: 'BR-KNM-001',
    status: 'Active',
    familyMembers: [
      { id: 'FM-3', name: 'Sunita Kumar', relation: 'Spouse', gender: 'Female', dob: '1984-07-11', anniversaryDate: '2010-04-15', phone: '9988776656' }
    ]
  }
];

const initialPoliciesSeed = [
  {
    id: 'POL-1001',
    customerName: 'Rahul Sharma',
    insuranceCompany: 'Star Health Insurance',
    type: 'Comprehensive Family Optima',
    sumInsured: 1000000,
    grossPremium: 28500,
    startDate: '2025-01-15',
    expiryDate: '2026-01-14',
    status: 'ACTIVE',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'POL-1002',
    customerName: 'Priya Menon',
    insuranceCompany: 'HDFC ERGO General',
    type: 'Health Suraksha Gold Plan',
    sumInsured: 1000000,
    grossPremium: 22000,
    startDate: '2025-03-15',
    expiryDate: '2026-03-14',
    status: 'ACTIVE',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'POL-1003',
    customerName: 'Anand Kumar',
    insuranceCompany: 'Tata AIA Life',
    type: 'Maha Life Supreme Term Shield',
    sumInsured: 20000000,
    grossPremium: 65000,
    startDate: '2024-08-20',
    expiryDate: '2026-08-19',
    status: 'DUE_RENEWAL',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  }
];

const initialInvestmentsSeed = [
  {
    id: 'INV-2001',
    customerName: 'Rahul Sharma',
    provider: 'Parag Parikh Flexi Cap AMC',
    type: 'Equity Mutual Fund SIP',
    amount: 25000,
    folioNumber: '10928374/88',
    status: 'APPROVED',
    date: '2025-02-01',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'INV-2002',
    customerName: 'Anand Kumar',
    provider: 'HDFC Mutual Fund & AMC',
    type: 'Balanced Advantage Fund Lump sum',
    amount: 500000,
    folioNumber: '99201827/12',
    status: 'APPROVED',
    date: '2025-01-15',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'INV-2003',
    customerName: 'Priya Menon',
    provider: 'SBI Fixed Deposit Desk',
    type: 'Corporate Fixed Deposit 8.25%',
    amount: 300000,
    folioNumber: 'FD-SBI-99120',
    status: 'PENDING',
    date: '2025-05-10',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    branchId: 'BR-KNM-001'
  }
];

const initialClaimsSeed = [
  {
    id: 'CLM-3001',
    customerName: 'Rahul Sharma',
    policyNo: 'POL-1001',
    insuranceCompany: 'Star Health Insurance',
    claimAmount: 45000,
    settlementAmount: 45000,
    hospitalOrGarage: 'Apollo Hospital Chennai',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    claimDate: '2025-06-12',
    status: 'SETTLED',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'CLM-3002',
    customerName: 'Priya Menon',
    policyNo: 'POL-1002',
    insuranceCompany: 'HDFC ERGO General',
    claimAmount: 18000,
    settlementAmount: 0,
    hospitalOrGarage: 'Fortis Hospital Bangalore',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    claimDate: '2025-07-28',
    status: 'IN_REVIEW',
    branchId: 'BR-KNM-001'
  }
];

const initialLeadsSeed = [
  {
    id: 'LD-4001',
    customerName: 'Sanjay Gupta',
    phone: '9711223344',
    email: 'sanjay.gupta@example.com',
    productInterest: 'Health Insurance & Mutual Funds',
    leadSource: 'Website Inquiry',
    leadStatus: 'HOT',
    city: 'Delhi',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    estimatedValue: 75000,
    createdDate: '2025-08-01',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'LD-4002',
    customerName: 'Deepak Verma',
    phone: '9822334455',
    email: 'deepak.v@example.com',
    productInterest: 'Term Life Cover 1Cr',
    leadSource: 'Referral',
    leadStatus: 'WARM',
    city: 'Mumbai',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    estimatedValue: 40000,
    createdDate: '2025-08-05',
    branchId: 'BR-KNM-001'
  }
];

const initialFollowupsSeed = [
  {
    id: 'FLW-5001',
    customerName: 'Rahul Sharma',
    stageName: 'Annual Policy Review & Top-Up',
    date: '2026-08-15 10:00 AM',
    type: 'Phone Call',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedTo: 'Priya Sharma',
    createdBy: 'Priya Sharma',
    conversationNotes: 'Client expressed interest in adding super top-up policy for parents.',
    status: 'PENDING',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'FLW-5002',
    customerName: 'Anand Kumar',
    stageName: 'Renewals Reminder & Payment Link',
    date: '2026-08-18 02:30 PM',
    type: 'WhatsApp & Call',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedTo: 'Priya Sharma',
    createdBy: 'Branch Manager',
    conversationNotes: 'Sent online payment portal link for Tata AIA renewal.',
    status: 'PENDING',
    branchId: 'BR-KNM-001'
  }
];

const initialTasksSeed = [
  {
    id: 'TSK-6001',
    customerName: 'Priya Menon',
    title: 'Collect KYC Pan & Aadhaar Self-Attested Copy',
    dueDate: '2026-08-16',
    priority: 'HIGH',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    status: 'PENDING',
    branchId: 'BR-KNM-001'
  },
  {
    id: 'TSK-6002',
    customerName: 'Rahul Sharma',
    title: 'Deliver Star Health Physical Insurance Smartcard',
    dueDate: '2026-08-20',
    priority: 'MEDIUM',
    assignedStaffId: 'UID-STF-1003',
    assignedStaffName: 'Priya Sharma',
    assignedStaff: 'Priya Sharma',
    status: 'COMPLETED',
    branchId: 'BR-KNM-001'
  }
];

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [rawCustomers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('crm_v2_customers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialCustomersSeed;
  });

  const [rawPolicies, setPolicies] = useState(() => {
    const saved = localStorage.getItem('crm_v2_policies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialPoliciesSeed;
  });

  const [rawInvestments, setInvestments] = useState(() => {
    const saved = localStorage.getItem('crm_v2_investments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialInvestmentsSeed;
  });

  const [rawClaims, setClaims] = useState(() => {
    const saved = localStorage.getItem('crm_v2_claims');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialClaimsSeed;
  });

  const [rawLeads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm_v2_leads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialLeadsSeed;
  });

  const [rawFollowups, setFollowups] = useState(() => {
    const saved = localStorage.getItem('crm_v2_followups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialFollowupsSeed;
  });

  const [rawTasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('crm_v2_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialTasksSeed;
  });

  const [rawIncome, setIncome] = useState(() => {
    const saved = localStorage.getItem('crm_v2_income');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [rawExpenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('crm_v2_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [rawAuditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('crm_v2_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'LOG-1001', userName: 'Prakash Gajendiran', userRole: 'SUPER_ADMIN', action: 'USER_LOGIN', module: 'Auth', affectedRecord: 'Session', timestamp: '2026-08-13 09:15:20', details: 'Super Admin logged in successfully' },
      { id: 'LOG-1002', userName: 'Priya Sharma', userRole: 'EMPLOYEE', action: 'CREATE_CLIENT', module: 'Customers', affectedRecord: 'Rahul Sharma (SK-CUST-101)', timestamp: '2026-08-13 09:30:10', details: 'New customer profile registered' }
    ];
  });

  // NOTE: We intentionally do NOT reset business data (customers, policies, etc.) on logout.
  // Data isolation is enforced by filterScopedRecords() inside each useMemo below.
  // When `user` changes (login/logout), useMemo recomputes the scoped views automatically.
  // Resetting to seed data on logout would permanently destroy real assignments.



  // Dynamically scoped data views based on active user's authorized role & staff ID
  const customers = useMemo(() => filterScopedRecords(user, rawCustomers), [user, rawCustomers]);
  const policies = useMemo(() => filterScopedRecords(user, rawPolicies), [user, rawPolicies]);
  const investments = useMemo(() => filterScopedRecords(user, rawInvestments), [user, rawInvestments]);
  const claims = useMemo(() => filterScopedRecords(user, rawClaims), [user, rawClaims]);
  const leads = useMemo(() => filterScopedRecords(user, rawLeads), [user, rawLeads]);
  const followups = useMemo(() => filterScopedRecords(user, rawFollowups), [user, rawFollowups]);
  const tasks = useMemo(() => filterScopedRecords(user, rawTasks), [user, rawTasks]);
  const income = useMemo(() => (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' ? rawIncome : []), [user, rawIncome]);
  const expenses = useMemo(() => (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' ? rawExpenses : []), [user, rawExpenses]);
  const auditLogs = useMemo(() => filterScopedRecords(user, rawAuditLogs), [user, rawAuditLogs]);

  // Sync state changes to LocalStorage + broadcast update event so other open sessions update
  useEffect(() => { localStorage.setItem('crm_v2_audit_logs',   JSON.stringify(rawAuditLogs));   }, [rawAuditLogs]);
  useEffect(() => {
    localStorage.setItem('crm_v2_customers', JSON.stringify(rawCustomers));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_customers' } }));
  }, [rawCustomers]);
  useEffect(() => {
    localStorage.setItem('crm_v2_policies', JSON.stringify(rawPolicies));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_policies' } }));
  }, [rawPolicies]);
  useEffect(() => { localStorage.setItem('crm_v2_investments', JSON.stringify(rawInvestments)); }, [rawInvestments]);
  useEffect(() => { localStorage.setItem('crm_v2_claims',      JSON.stringify(rawClaims));      }, [rawClaims]);
  useEffect(() => { localStorage.setItem('crm_v2_leads',       JSON.stringify(rawLeads));       }, [rawLeads]);
  useEffect(() => { localStorage.setItem('crm_v2_followups',   JSON.stringify(rawFollowups));   }, [rawFollowups]);
  useEffect(() => {
    localStorage.setItem('crm_v2_tasks', JSON.stringify(rawTasks));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_tasks' } }));
  }, [rawTasks]);
  useEffect(() => { localStorage.setItem('crm_v2_income',   JSON.stringify(rawIncome));   }, [rawIncome]);
  useEffect(() => { localStorage.setItem('crm_v2_expenses', JSON.stringify(rawExpenses)); }, [rawExpenses]);

  // Real-time cross-session sync:
  // When another session (e.g. admin tab) writes to localStorage, the native 'storage'
  // event fires in THIS session (e.g. staff tab). Reload the changed collection so
  // the staff's dashboard and Customer 360 update immediately without a page refresh.
  useEffect(() => {
    const reloadFromStorage = (key, setter) => {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) setter(parsed);
        }
      } catch (e) {}
    };

    // Native storage event fires across browser tabs (different-tab updates)
    const handleStorageEvent = (e) => {
      if (e.key === 'crm_v2_customers')  reloadFromStorage('crm_v2_customers',  setCustomers);
      if (e.key === 'crm_v2_policies')   reloadFromStorage('crm_v2_policies',   setPolicies);
      if (e.key === 'crm_v2_tasks')      reloadFromStorage('crm_v2_tasks',      setTasks);
      if (e.key === 'crm_v2_leads')      reloadFromStorage('crm_v2_leads',      setLeads);
      if (e.key === 'crm_v2_followups')  reloadFromStorage('crm_v2_followups',  setFollowups);
      if (e.key === 'crm_v2_investments')reloadFromStorage('crm_v2_investments',setInvestments);
      if (e.key === 'crm_v2_claims')     reloadFromStorage('crm_v2_claims',     setClaims);
    };

    // crm_data_updated fires within the same tab when WE write (storage event doesn't)
    // This covers the case where admin assigns while staff is on the same browser session
    const handleCrmUpdate = (e) => {
      const key = e?.detail?.key;
      if (key === 'crm_v2_customers')  reloadFromStorage('crm_v2_customers',  setCustomers);
      if (key === 'crm_v2_policies')   reloadFromStorage('crm_v2_policies',   setPolicies);
      if (key === 'crm_v2_tasks')      reloadFromStorage('crm_v2_tasks',      setTasks);
    };

    window.addEventListener('storage',          handleStorageEvent);
    window.addEventListener('crm_data_updated', handleCrmUpdate);
    return () => {
      window.removeEventListener('storage',          handleStorageEvent);
      window.removeEventListener('crm_data_updated', handleCrmUpdate);
    };
  }, []);



  // Real-time Firestore snapshot listeners for zero-latency cross-device database synchronization
  useEffect(() => {
    // 1. Customers
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(items);
      }
    }, err => console.warn("Firestore customers snapshot error:", err));

    // 2. Policies
    const unsubPolicies = onSnapshot(collection(db, 'policies'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPolicies(items);
      }
    }, err => console.warn("Firestore policies snapshot error:", err));

    // 3. Investments
    const unsubInvestments = onSnapshot(collection(db, 'investments'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInvestments(items);
      }
    }, err => console.warn("Firestore investments snapshot error:", err));

    // 4. Claims
    const unsubClaims = onSnapshot(collection(db, 'claims'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClaims(items);
      }
    }, err => console.warn("Firestore claims snapshot error:", err));

    // 5. Leads
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLeads(items);
      }
    }, err => console.warn("Firestore leads snapshot error:", err));

    // 6. Followups
    const unsubFollowups = onSnapshot(collection(db, 'followups'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFollowups(items);
      }
    }, err => console.warn("Firestore followups snapshot error:", err));

    // 7. Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(items);
      }
    }, err => console.warn("Firestore tasks snapshot error:", err));

    // 8. Income
    const unsubIncome = onSnapshot(collection(db, 'income'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setIncome(items);
      }
    }, err => console.warn("Firestore income snapshot error:", err));

    // 9. Expenses
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setExpenses(items);
      }
    }, err => console.warn("Firestore expenses snapshot error:", err));

    return () => {
      unsubCustomers();
      unsubPolicies();
      unsubInvestments();
      unsubClaims();
      unsubLeads();
      unsubFollowups();
      unsubTasks();
      unsubIncome();
      unsubExpenses();
    };
  }, []);

  /**
   * notifyCustomerAssignment
   * Fires a notification to the assigned staff AND auto-creates a follow-up Task.
   *
   * @param {object|string} staffInfo  - Full staff object { uid, name, email } OR just a name string (legacy).
   * @param {string}        customerName - The customer's display name.
   * @param {boolean}       isReassignment - true if this is a reassignment, false for new assignment.
   * @param {string}        assignedByName - Name of the admin/manager who made the assignment.
   */
  const notifyCustomerAssignment = async (staffInfo, customerName, isReassignment = false, assignedByName = null) => {
    if (!staffInfo) return;

    // Accept both a full staff object and a legacy name string
    const staffName  = typeof staffInfo === 'string' ? staffInfo : (staffInfo.name  || '');
    const staffUid   = typeof staffInfo === 'string' ? ''        : (staffInfo.uid   || '');
    const staffEmail = typeof staffInfo === 'string' ? ''        : (staffInfo.email || '');

    if (!staffName) return;

    const notifId = 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const byLine  = assignedByName ? ` by ${assignedByName}` : '';

    const notifObj = {
      id:             notifId,
      recipientId:    staffUid,
      recipientName:  staffName,
      recipientEmail: staffEmail,
      senderId:       user?.uid   || 'SYSTEM',
      senderName:     user?.name  || 'System Administrator',
      type:           'CUSTOMER_ASSIGNED',
      title:          isReassignment
        ? '👤 Customer Portfolio Reassigned to You'
        : '👤 New Customer Assigned to Your Portfolio!',
      message:        isReassignment
        ? `Customer "${customerName}" has been reassigned to your portfolio${byLine}. Please reach out and introduce yourself.`
        : `New customer "${customerName}" has been added and assigned to your portfolio${byLine}. Schedule a welcome call within 24 hours.`,
      isRead:    false,
      read:      false,
      createdAt: new Date().toISOString()
    };

    // 1. Persist to localStorage + dispatch event → bell icon updates immediately
    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      localStorage.setItem('crm_v2_notifications', JSON.stringify([notifObj, ...stored]));
      window.dispatchEvent(new CustomEvent('storage_notifications_updated', { detail: notifObj }));
    } catch (e) {}

    // 2. Write to Firestore for cloud persistence & cross-device sync
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notifObj,
        createdAt: serverTimestamp()
      });
    } catch (e) {}

    // 3. Legacy event for any other listeners
    try {
      window.dispatchEvent(new CustomEvent('storage_customer_assigned', {
        detail: { advisorName: staffName, customerName }
      }));
    } catch (e) {}

    // 4. Auto-create a Task for the assigned staff
    //    (setTasks is available via closure; it's initialized before this is ever called)
    try {
      const taskDue = new Date();
      taskDue.setDate(taskDue.getDate() + 1); // Due tomorrow

      const autoTask = {
        id:            'TASK-AUTO-' + Date.now(),
        title:         isReassignment
          ? `📋 Follow up with reassigned customer: ${customerName}`
          : `📞 Welcome call – New customer: ${customerName}`,
        description:   isReassignment
          ? `${customerName} has been reassigned to your portfolio${byLine}. Introduce yourself and confirm their policy details.`
          : `${customerName} is newly assigned to your portfolio${byLine}. Schedule an introductory call and collect any outstanding documents.`,
        customerName,
        assignedStaff:   staffName,
        assignedStaffId: staffUid,
        assignedTo:      staffName,
        staffId:         staffUid,
        dueDate:         taskDue.toISOString().split('T')[0],
        priority:        'HIGH',
        status:          'PENDING',
        type:            'CUSTOMER_ASSIGNMENT',
        autoGenerated:   true,
        createdAt:       new Date().toISOString()
      };

      setTasks(prev => [autoTask, ...prev]);
      try { createTaskBackend(autoTask); } catch (_) {}
    } catch (e) {}
  };

  // CRUD Actions with Canonical Staff Identification
  const addCustomer = async (custData) => {
    const id = custData.id || `SK-CUST-${100 + rawCustomers.length + 1}`;
    const assignedStaffId = custData.assignedStaffId || custData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = custData.assignedStaffName || custData.assignedAdvisorName || custData.assignedStaff || user?.name || 'Priya Sharma';
    const assignedStaffEmail = custData.assignedStaffEmail || custData.advisorEmail || user?.email || 'priya.sharma@sk-smart-investments.com';
    const branchId = custData.branchId || custData.branch || user?.branchId || 'BR-KNM-001';

    const newCust = {
      ...custData,
      id,
      customerCode: id,
      assignedStaffId,
      assignedStaffName,
      assignedAdvisorName: assignedStaffName,
      assignedStaffEmail,
      branchId,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [newCust, ...prev]);
    try { await createCustomerBackend(newCust); } catch (e) {}
    
    if (newCust.assignedStaffName || newCust.assignedAdvisorName) {
      notifyCustomerAssignment(
        { uid: newCust.assignedStaffId, name: newCust.assignedStaffName || newCust.assignedAdvisorName, email: newCust.assignedStaffEmail },
        newCust.name,
        false,
        user?.name
      );
    }

    addAuditLog({
      userName: user?.name || newCust.assignedAdvisorName || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'CREATE_CLIENT',
      module: 'Customers',
      affectedRecord: `${newCust.name} (${newCust.customerCode})`,
      details: `Created customer profile assigned to ${assignedStaffName}`
    });
    return newCust;
  };

  /**
   * updateCustomer - Update a customer record in state and localStorage.
   * @param {object|string} idOrData - Full customer data object OR customer ID string.
   * @param {object|null}   reassignmentMeta - Optional. When provided the staff was changed:
   *   { previousStaffId, previousStaffName, newStaffId, newStaffName }
   *   This triggers a dedicated REASSIGN_CUSTOMER audit log entry.
   */
  const updateCustomer = async (idOrData, reassignmentMeta = null) => {
    if (!idOrData) return;
    const targetId = typeof idOrData === 'object' ? idOrData.id || idOrData.customerCode : idOrData;
    const updateObj = typeof idOrData === 'object' ? idOrData : {};

    let finalUpdatedRecord = null;

    setCustomers(prev => prev.map(c => {
      if (c.id === targetId || c.customerCode === targetId || c.name === targetId) {
        const incomingStaffId = updateObj.assignedStaffId || updateObj.staffId;
        const finalStaffId    = incomingStaffId ? incomingStaffId : c.assignedStaffId;
        const finalStaffName  = updateObj.assignedStaffName || updateObj.assignedAdvisorName || updateObj.assignedStaff || c.assignedStaffName;

        finalUpdatedRecord = {
          ...c,
          ...updateObj,
          assignedStaffId:     finalStaffId,
          assignedStaffName:   finalStaffName,
          assignedAdvisorName: finalStaffName,
        };
        return finalUpdatedRecord;
      }
      return c;
    }));

    if (finalUpdatedRecord) {
      try {
        await updateCustomerBackend(targetId, finalUpdatedRecord);
      } catch (e) {
        try { await setDoc(doc(db, 'customers', targetId), finalUpdatedRecord, { merge: true }); } catch (_) {}
      }
    }

    // Notify on any staff name change (e.g. toast/bell notification)
    const newName  = updateObj.assignedStaffName || updateObj.assignedAdvisorName || updateObj.assignedStaff;
    const newUid   = updateObj.assignedStaffId   || updateObj.staffId || '';
    const newEmail = updateObj.assignedStaffEmail || '';
    if (newName) {
      notifyCustomerAssignment(
        { uid: newUid, name: newName, email: newEmail },
        updateObj.name || String(targetId),
        true,
        user?.name
      );
    }

    // Write audit log — specialized entry for reassignments
    if (reassignmentMeta) {
      addAuditLog({
        userName:  user?.name || 'Admin',
        userRole:  user?.role || 'ADMIN',
        action:    'REASSIGN_CUSTOMER',
        module:    'Customers',
        affectedRecord: `${updateObj.name || String(targetId)} (${targetId})`,
        details:   `Staff reassigned from "${reassignmentMeta.previousStaffName}" [${reassignmentMeta.previousStaffId}] → "${reassignmentMeta.newStaffName}" [${reassignmentMeta.newStaffId}]`
      });
    } else {
      addAuditLog({
        userName:  user?.name || 'Staff Advisor',
        userRole:  user?.role || 'STAFF',
        action:    'UPDATE_CUSTOMER',
        module:    'Customers',
        affectedRecord: String(targetId),
        details:   'Updated customer profile details & relationships'
      });
    }
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id && c.name !== id));
    try { await deleteCustomerBackend(id); } catch (e) {}
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_CLIENT',
      module: 'Customers',
      affectedRecord: String(id),
      details: 'Deleted customer record'
    });
  };

  const addPolicy = async (polData) => {
    const id = polData.id || `POL-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = polData.assignedStaffId || polData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = polData.assignedStaffName || polData.assignedStaff || user?.name || 'Priya Sharma';

    const newPol = { 
      ...polData, 
      id, 
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      startDate: polData.startDate || new Date().toISOString().split('T')[0] 
    };

    setPolicies(prev => [newPol, ...prev]);
    try { await setDoc(doc(db, 'policies', id), newPol, { merge: true }); } catch (e) {}

    addAuditLog({
      userName: user?.name || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'CREATE_POLICY',
      module: 'Policies',
      affectedRecord: `${newPol.insuranceCompany} (${id})`,
      details: `Issued policy for ${newPol.customerName}`
    });
    return newPol;
  };

  const addInvestment = (invData) => {
    const id = invData.id || `INV-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = invData.assignedStaffId || invData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = invData.assignedStaffName || invData.advisorName || user?.name || 'Priya Sharma';

    const newInv = {
      ...invData,
      id,
      assignedStaffId,
      assignedStaffName,
      status: invData.status || 'PENDING',
      date: invData.date || new Date().toISOString().split('T')[0]
    };

    setInvestments(prev => [newInv, ...prev]);
    try { createInvestmentBackend(newInv); } catch (e) {}
    return newInv;
  };

  const updateInvestmentStatus = async (id, newStatus) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    try { await setDoc(doc(db, 'investments', id), { status: newStatus }, { merge: true }); } catch (e) {}
  };

  const addClaim = async (claimData) => {
    const id = claimData.id || `CLM-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = claimData.assignedStaffId || claimData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = claimData.assignedStaffName || claimData.assignedStaff || user?.name || 'Priya Sharma';

    const newClaim = {
      ...claimData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      claimDate: claimData.claimDate || new Date().toISOString().split('T')[0],
      status: 'SUBMITTED'
    };

    setClaims(prev => [newClaim, ...prev]);
    try { await setDoc(doc(db, 'claims', id), newClaim, { merge: true }); } catch (e) {}
    return newClaim;
  };

  const updateClaimStatus = async (id, newStatus) => {
    setClaims(prev => prev.map(clm => clm.id === id ? { ...clm, status: newStatus } : clm));
    try { await setDoc(doc(db, 'claims', id), { status: newStatus }, { merge: true }); } catch (e) {}
  };

  const addLead = (leadData) => {
    const id = leadData.id || `LD-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = leadData.assignedStaffId || leadData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = leadData.assignedStaffName || leadData.assignedStaff || user?.name || 'Priya Sharma';

    const newLead = {
      ...leadData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [newLead, ...prev]);
    try { createLeadBackend(newLead); } catch (e) {}
    return newLead;
  };

  const convertLeadToCustomer = async (leadId) => {
    const lead = rawLeads.find(l => l.id === leadId);
    if (!lead) return;

    addCustomer({
      name: lead.customerName,
      phone: lead.phone,
      email: lead.email,
      city: lead.city || 'Chennai',
      assignedStaffId: lead.assignedStaffId,
      assignedStaffName: lead.assignedStaffName,
      assignedAdvisorName: lead.assignedStaffName || lead.assignedStaff
    });

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: 'CONVERTED' } : l));
    try { await setDoc(doc(db, 'leads', leadId), { leadStatus: 'CONVERTED' }, { merge: true }); } catch (e) {}
  };

  const addFollowup = async (flwData) => {
    const id = flwData.id || `FLW-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = flwData.assignedStaffId || flwData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = flwData.assignedStaffName || flwData.assignedTo || user?.name || 'Priya Sharma';

    const newFlw = {
      ...flwData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedTo: assignedStaffName,
      createdBy: user?.name || 'Staff Advisor',
      status: 'PENDING'
    };

    setFollowups(prev => [newFlw, ...prev]);
    try { await setDoc(doc(db, 'followups', id), newFlw, { merge: true }); } catch (e) {}
    return newFlw;
  };

  const addTask = (taskData) => {
    const id = taskData.id || `TSK-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedStaffId = taskData.assignedStaffId || taskData.staffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = taskData.assignedStaffName || taskData.assignedStaff || user?.name || 'Priya Sharma';

    const newTask = {
      ...taskData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      status: 'PENDING'
    };

    setTasks(prev => [newTask, ...prev]);
    try { createTaskBackend(newTask); } catch (e) {}
    return newTask;
  };

  const updateTaskStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try { await setDoc(doc(db, 'tasks', id), { status: newStatus }, { merge: true }); } catch (e) {}
  };

  const addIncome = (incData) => {
    const id = incData.id || `INC-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc = { ...incData, id, date: incData.date || new Date().toISOString().split('T')[0] };
    setIncome(prev => [newInc, ...prev]);
    try { createIncomeBackend(newInc); } catch (e) {}
    return newInc;
  };

  const addExpense = (expData) => {
    const id = expData.id || `EXP-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExp = { ...expData, id, date: expData.date || new Date().toISOString().split('T')[0] };
    setExpenses(prev => [newExp, ...prev]);
    try { createExpenseBackend(newExp); } catch (e) {}
    return newExp;
  };

  const getCustomerAggregatedDetails = (customerOrName) => {
    if (!customerOrName) return null;

    let searchName = '';
    let searchId = '';

    if (typeof customerOrName === 'object') {
      searchName = customerOrName.name || customerOrName.customerName || customerOrName.clientName || '';
      searchId = customerOrName.id || customerOrName.customerCode || customerOrName.customerId || '';
    } else if (typeof customerOrName === 'string') {
      searchName = customerOrName.trim();
    }

    const masterCustomer = rawCustomers.find(c => 
      (searchId && (c.id?.toLowerCase().trim() === searchId.toLowerCase().trim() || c.customerCode?.toLowerCase().trim() === searchId.toLowerCase().trim())) ||
      (searchName && c.name?.toLowerCase().trim() === searchName.toLowerCase().trim())
    );

    // Security check: Verify active user has permission to open this customer 360 profile
    if (masterCustomer && !canAccessCustomer(user, masterCustomer)) {
      return {
        accessDenied: true,
        message: 'Unauthorized Access: You do not have authorization to view this customer portfolio.'
      };
    }

    const effectiveName = masterCustomer?.name || searchName;
    const effectiveCode = masterCustomer?.customerCode || masterCustomer?.id || searchId;

    const matchingName = (n) => n && effectiveName && n.toLowerCase().trim() === effectiveName.toLowerCase().trim();
    
    const matchingRecord = (rec) => {
      if (!rec) return false;
      const recCode = rec.customerCode || rec.customerId || rec.customer_id;
      if (effectiveCode && recCode) {
        return recCode.toLowerCase().trim() === effectiveCode.toLowerCase().trim();
      }
      return matchingName(rec.customerName || rec.clientName || rec.name);
    };

    const userPolicies = rawPolicies.filter(matchingRecord);
    const userInvestments = rawInvestments.filter(matchingRecord);
    const userClaims = rawClaims.filter(matchingRecord);
    const userFollowups = rawFollowups.filter(matchingRecord);
    const userTasks = rawTasks.filter(matchingRecord);
    const userLeads = rawLeads.filter(matchingRecord);

    const userRenewals = userPolicies.map(p => ({
      id: `RNW-${p.id}`,
      policyNo: p.id,
      customerName: p.customerName || effectiveName,
      insuranceCompany: p.insuranceCompany,
      type: p.type,
      premiumAmount: p.grossPremium,
      dueDate: p.expiryDate,
      assignedStaff: p.assignedStaffName || p.assignedStaff,
      status: new Date(p.expiryDate) < new Date() ? 'EXPIRED' : 'DUE_SOON'
    }));

    const baseCustomer = masterCustomer ? { ...masterCustomer } : {
      id: searchId || `SK-CUST-${Math.floor(100 + Math.random() * 900)}`,
      customerCode: searchId || `SK-CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: effectiveName,
      phone: userPolicies[0]?.phone || userInvestments[0]?.phone || userLeads[0]?.phone || '9876543210',
      email: userLeads[0]?.email || `${effectiveName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      gender: 'Male',
      city: userLeads[0]?.city || 'Chennai',
      assignedAdvisorName: userPolicies[0]?.assignedStaffName || userPolicies[0]?.assignedStaff || 'Priya Sharma',
      status: 'Active',
      familyMembers: []
    };

    return {
      ...baseCustomer,
      policiesList: userPolicies,
      investmentsList: userInvestments,
      claimsList: userClaims,
      renewalsList: userRenewals,
      followupsList: userFollowups,
      tasksList: userTasks,
      leadsList: userLeads
    };
  };

  const addAuditLog = (logData) => {
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      userName: logData.userName || user?.name || 'System User',
      userRole: logData.userRole || user?.role || 'STAFF',
      action: logData.action || 'MUTATION',
      module: logData.module || 'General',
      affectedRecord: logData.affectedRecord || '-',
      timestamp: logData.timestamp || new Date().toLocaleString('en-IN'),
      details: logData.details || 'Action completed successfully'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  return (
    <DataContext.Provider value={{
      customers,
      policies,
      investments,
      claims,
      leads,
      followups,
      tasks,
      income,
      expenses,
      auditLogs,
      rawCustomers,
      rawPolicies,
      rawInvestments,
      rawClaims,
      rawLeads,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addPolicy,
      addInvestment,
      updateInvestmentStatus,
      addClaim,
      updateClaimStatus,
      addLead,
      convertLeadToCustomer,
      addFollowup,
      addTask,
      updateTaskStatus,
      addIncome,
      addExpense,
      addAuditLog,
      getCustomerAggregatedDetails
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
