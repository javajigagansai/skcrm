import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchCustomersBackend, createCustomerBackend, deleteCustomerBackend,
  fetchLeadsBackend, createLeadBackend,
  fetchInvestmentsBackend, createInvestmentBackend,
  fetchIncomeBackend, createIncomeBackend,
  fetchExpensesBackend, createExpenseBackend,
  fetchTasksBackend, createTaskBackend
} from '../services/apiService';

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
    assignedAdvisorName: 'Priya Sharma',
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
    assignedAdvisorName: 'Priya Sharma',
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
    assignedAdvisorName: 'Priya Sharma',
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
    sumInsured: 1500000,
    grossPremium: 32000,
    startDate: '2025-01-10',
    expiryDate: '2026-01-09',
    status: 'ACTIVE',
    assignedStaff: 'Priya Sharma'
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
    assignedStaff: 'Priya Sharma'
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
    assignedStaff: 'Priya Sharma'
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
    date: '2025-02-01'
  },
  {
    id: 'INV-2002',
    customerName: 'Anand Kumar',
    provider: 'HDFC Mutual Fund & AMC',
    type: 'Balanced Advantage Fund Lump sum',
    amount: 500000,
    folioNumber: '99201827/12',
    status: 'APPROVED',
    date: '2025-01-15'
  },
  {
    id: 'INV-2003',
    customerName: 'Priya Menon',
    provider: 'SBI Fixed Deposit Desk',
    type: 'Corporate Fixed Deposit 8.25%',
    amount: 300000,
    folioNumber: 'FD-SBI-99120',
    status: 'PENDING',
    date: '2025-05-10'
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
    assignedStaff: 'Priya Sharma',
    claimDate: '2025-06-12',
    status: 'SETTLED'
  },
  {
    id: 'CLM-3002',
    customerName: 'Priya Menon',
    policyNo: 'POL-1002',
    insuranceCompany: 'HDFC ERGO General',
    claimAmount: 18000,
    settlementAmount: 0,
    hospitalOrGarage: 'Fortis Hospital Bangalore',
    assignedStaff: 'Kavita Menon',
    claimDate: '2025-07-28',
    status: 'IN_REVIEW'
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
    assignedStaff: 'Priya Sharma',
    estimatedValue: 75000,
    createdDate: '2025-08-01'
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
    assignedStaff: 'Priya Sharma',
    estimatedValue: 40000,
    createdDate: '2025-08-05'
  }
];

const initialFollowupsSeed = [
  {
    id: 'FLW-5001',
    customerName: 'Rahul Sharma',
    stageName: 'Annual Policy Review & Top-Up',
    date: '2026-08-15 10:00 AM',
    type: 'Phone Call',
    assignedTo: 'Priya Sharma',
    createdBy: 'Priya Sharma',
    conversationNotes: 'Client expressed interest in adding super top-up policy for parents.',
    status: 'PENDING'
  },
  {
    id: 'FLW-5002',
    customerName: 'Anand Kumar',
    stageName: 'Renewals Reminder & Payment Link',
    date: '2026-08-18 02:30 PM',
    type: 'WhatsApp & Call',
    assignedTo: 'Priya Sharma',
    createdBy: 'Branch Manager',
    conversationNotes: 'Sent online payment portal link for Tata AIA renewal.',
    status: 'PENDING'
  }
];

const initialTasksSeed = [
  {
    id: 'TSK-6001',
    customerName: 'Priya Menon',
    title: 'Collect KYC Pan & Aadhaar Self-Attested Copy',
    dueDate: '2026-08-16',
    priority: 'HIGH',
    assignedStaff: 'Priya Sharma',
    status: 'PENDING'
  },
  {
    id: 'TSK-6002',
    customerName: 'Rahul Sharma',
    title: 'Deliver Star Health Physical Insurance Smartcard',
    dueDate: '2026-08-20',
    priority: 'MEDIUM',
    assignedStaff: 'Priya Sharma',
    status: 'COMPLETED'
  }
];

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('crm_v2_customers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialCustomersSeed;
  });

  const [policies, setPolicies] = useState(() => {
    const saved = localStorage.getItem('crm_v2_policies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialPoliciesSeed;
  });

  const [investments, setInvestments] = useState(() => {
    const saved = localStorage.getItem('crm_v2_investments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialInvestmentsSeed;
  });

  const [claims, setClaims] = useState(() => {
    const saved = localStorage.getItem('crm_v2_claims');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialClaimsSeed;
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm_v2_leads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialLeadsSeed;
  });

  const [followups, setFollowups] = useState(() => {
    const saved = localStorage.getItem('crm_v2_followups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialFollowupsSeed;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('crm_v2_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialTasksSeed;
  });

  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('crm_v2_income');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('crm_v2_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('crm_v2_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'LOG-1001', userName: 'Prakash Gajendiran', userRole: 'SUPER_ADMIN', action: 'USER_LOGIN', module: 'Auth', affectedRecord: 'Session', timestamp: '2026-08-13 09:15:20', details: 'Super Admin logged in successfully' },
      { id: 'LOG-1002', userName: 'Priya Sharma', userRole: 'EMPLOYEE', action: 'CREATE_CLIENT', module: 'Customers', affectedRecord: 'Rahul Sharma (SK-CUST-101)', timestamp: '2026-08-13 09:30:10', details: 'New customer profile registered' },
      { id: 'LOG-1003', userName: 'Branch Manager', userRole: 'MANAGER', action: 'FILE_CLAIM', module: 'Claims', affectedRecord: 'CLM-2026-001', timestamp: '2026-08-13 10:05:44', details: 'Health insurance claim submitted for ₹1,50,000' },
      { id: 'LOG-1004', userName: 'Priya Sharma', userRole: 'EMPLOYEE', action: 'UPDATE_FOLLOWUP', module: 'Followups', affectedRecord: 'Priya Menon', timestamp: '2026-08-13 11:20:15', details: 'Scheduled callback for quotation review' },
      { id: 'LOG-1005', userName: 'Prakash Gajendiran', userRole: 'SUPER_ADMIN', action: 'STAFF_REASSIGNMENT', module: 'Staff Portal', affectedRecord: 'Anand Kumar', timestamp: '2026-08-13 12:00:00', details: 'Reassigned 5 client portfolios to Priya Sharma' }
    ];
  });

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('crm_v2_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('crm_v2_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('crm_v2_policies', JSON.stringify(policies)); }, [policies]);
  useEffect(() => { localStorage.setItem('crm_v2_investments', JSON.stringify(investments)); }, [investments]);
  useEffect(() => { localStorage.setItem('crm_v2_claims', JSON.stringify(claims)); }, [claims]);
  useEffect(() => { localStorage.setItem('crm_v2_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('crm_v2_followups', JSON.stringify(followups)); }, [followups]);
  useEffect(() => { localStorage.setItem('crm_v2_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('crm_v2_income', JSON.stringify(income)); }, [income]);
  useEffect(() => { localStorage.setItem('crm_v2_expenses', JSON.stringify(expenses)); }, [expenses]);

  // Load from Firestore asynchronously without blocking initial render
  useEffect(() => {
    const fetchRemoteData = async () => {
      try {
        const [cData, lData, iData, tData] = await Promise.allSettled([
          fetchCustomersBackend(),
          fetchLeadsBackend(),
          fetchInvestmentsBackend(),
          fetchTasksBackend()
        ]);

        if (cData.status === 'fulfilled' && Array.isArray(cData.value) && cData.value.length > 0) {
          setCustomers(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            cData.value.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
        if (lData.status === 'fulfilled' && Array.isArray(lData.value) && lData.value.length > 0) {
          setLeads(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            lData.value.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
        if (iData.status === 'fulfilled' && Array.isArray(iData.value) && iData.value.length > 0) {
          setInvestments(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            iData.value.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
        if (tData.status === 'fulfilled' && Array.isArray(tData.value) && tData.value.length > 0) {
          setTasks(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            tData.value.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
      } catch (e) {}
    };
    fetchRemoteData();
  }, []);

  // CRUD Actions
  // CRUD Actions
  const addCustomer = async (custData) => {
    const id = custData.id || `SK-CUST-${100 + customers.length + 1}`;
    const newCust = { ...custData, id, customerCode: id, createdAt: new Date().toISOString() };
    setCustomers(prev => [newCust, ...prev]);
    try { await createCustomerBackend(newCust); } catch (e) {}
    addAuditLog({
      userName: newCust.assignedAdvisorName || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'CREATE_CLIENT',
      module: 'Customers',
      affectedRecord: `${newCust.name} (${newCust.customerCode})`,
      details: 'Created new customer profile'
    });
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers(prev => prev.map(c => c.id === id || c.name === id ? { ...c, ...updatedFields } : c));
    addAuditLog({
      userName: updatedFields.assignedAdvisorName || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'UPDATE_CLIENT',
      module: 'Customers',
      affectedRecord: String(id),
      details: 'Updated customer profile details and relationships'
    });
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id && c.name !== id));
    try { await deleteCustomerBackend(id); } catch (e) {}
    addAuditLog({
      userName: 'Admin User',
      userRole: 'ADMIN',
      action: 'DELETE_CLIENT',
      module: 'Customers',
      affectedRecord: String(id),
      details: 'Deleted customer record'
    });
  };

  const addPolicy = (polData) => {
    const id = polData.id || `POL-SK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPol = { ...polData, id, startDate: polData.startDate || new Date().toISOString().split('T')[0] };
    setPolicies(prev => [newPol, ...prev]);
    
    // Auto-create/link customer if not exists
    if (polData.customerName) {
      setCustomers(prev => {
        const exists = prev.some(c => c.name.toLowerCase() === polData.customerName.toLowerCase());
        if (!exists) {
          return [{
            id: `CUST-${Date.now()}`,
            customerCode: `SK-CUST-${Math.floor(100 + Math.random() * 900)}`,
            name: polData.customerName,
            phone: polData.phone || '',
            insuranceCompany: polData.insuranceCompany || '',
            insuranceType: polData.type || '',
            status: 'Active',
            familyMembers: []
          }, ...prev];
        }
        return prev;
      });
    }

    addAuditLog({
      userName: polData.assignedStaff || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'CREATE_POLICY',
      module: 'Policies',
      affectedRecord: `${newPol.id} (${newPol.customerName})`,
      details: `Issued ${newPol.type || 'Insurance'} policy`
    });

    return newPol;
  };

  const addInvestment = async (invData) => {
    const id = invData.id || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv = { ...invData, id, date: invData.date || new Date().toISOString().split('T')[0] };
    setInvestments(prev => [newInv, ...prev]);
    try { await createInvestmentBackend(newInv); } catch (e) {}
    addAuditLog({
      userName: invData.advisorName || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'CREATE_INVESTMENT',
      module: 'Investments',
      affectedRecord: `${newInv.id} (${newInv.customerName})`,
      details: `Recorded ₹${newInv.amount} investment in ${newInv.provider}`
    });
    return newInv;
  };

  const updateInvestmentStatus = (id, status) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const addClaim = (claimData) => {
    const id = claimData.id || `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClaim = { 
      ...claimData, 
      id, 
      claimDate: claimData.claimDate || new Date().toISOString().split('T')[0],
      status: claimData.status || 'SUBMITTED'
    };
    setClaims(prev => [newClaim, ...prev]);
    addAuditLog({
      userName: claimData.assignedStaff || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'FILE_CLAIM',
      module: 'Claims',
      affectedRecord: `${newClaim.id} (${newClaim.customerName})`,
      details: `Filed claim for ₹${newClaim.claimAmount}`
    });
    return newClaim;
  };

  const updateClaimStatus = (id, status, settlementAmount) => {
    setClaims(prev => prev.map(c => c.id === id ? { 
      ...c, 
      status, 
      settlementAmount: status === 'SETTLED' ? (settlementAmount || c.claimAmount) : c.settlementAmount 
    } : c));
    addAuditLog({
      userName: 'Claims Officer',
      userRole: 'MANAGER',
      action: 'UPDATE_CLAIM_STATUS',
      module: 'Claims',
      affectedRecord: String(id),
      details: `Claim status updated to ${status}`
    });
  };

  const addLead = async (leadData) => {
    const id = leadData.id || `LD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLead = { ...leadData, id, createdDate: new Date().toISOString().split('T')[0] };
    setLeads(prev => [newLead, ...prev]);
    try { await createLeadBackend(newLead); } catch (e) {}
    return newLead;
  };

  const convertLeadToCustomer = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: 'CONVERTED' } : l));

    // Create Customer
    addCustomer({
      name: lead.customerName,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      assignedAdvisorName: lead.assignedStaff,
      occupation: lead.productInterest,
      status: 'Active',
      familyMembers: []
    });

    addAuditLog({
      userName: lead.assignedStaff || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'CONVERT_LEAD',
      module: 'Leads',
      affectedRecord: lead.customerName,
      details: 'Converted lead into active customer profile'
    });
  };

  const addFollowup = (followupData) => {
    const id = followupData.id || `FLW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newFlw = { ...followupData, id };
    setFollowups(prev => [newFlw, ...prev]);
    addAuditLog({
      userName: followupData.assignedTo || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'ADD_FOLLOWUP',
      module: 'Followups',
      affectedRecord: followupData.clientName || followupData.customerName,
      details: `Recorded followup stage: ${followupData.stageName || 'Interaction'}`
    });
    return newFlw;
  };

  const addTask = async (taskData) => {
    const id = taskData.id || `TSK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTask = { ...taskData, id, status: taskData.status || 'PENDING' };
    setTasks(prev => [newTask, ...prev]);
    try { await createTaskBackend(newTask); } catch (e) {}
    addAuditLog({
      userName: taskData.assignedStaff || 'Staff Advisor',
      userRole: 'STAFF',
      action: 'CREATE_TASK',
      module: 'Tasks',
      affectedRecord: newTask.title,
      details: `Assigned new task due ${newTask.dueDate}`
    });
    return newTask;
  };

  const updateTaskStatus = (id, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const addIncome = async (incData) => {
    const id = incData.id || `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc = { ...incData, id, date: incData.date || new Date().toISOString().split('T')[0] };
    setIncome(prev => [newInc, ...prev]);
    try { await createIncomeBackend(newInc); } catch (e) {}
    return newInc;
  };

  const addExpense = async (expData) => {
    const id = expData.id || `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExp = { ...expData, id, date: expData.date || new Date().toISOString().split('T')[0] };
    setExpenses(prev => [newExp, ...prev]);
    try { await createExpenseBackend(newExp); } catch (e) {}
    return newExp;
  };

  // Dynamic aggregation for Customer 360: Matches by name, ID, phone, or email
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

    // Try to find the master customer in `customers` dataset by ID or Name
    const masterCustomer = customers.find(c => 
      (searchId && (c.id?.toLowerCase().trim() === searchId.toLowerCase().trim() || c.customerCode?.toLowerCase().trim() === searchId.toLowerCase().trim())) ||
      (searchName && c.name?.toLowerCase().trim() === searchName.toLowerCase().trim())
    );

    const effectiveName = masterCustomer?.name || searchName;
    const effectiveCode = masterCustomer?.customerCode || masterCustomer?.id || searchId;

    const matchingName = (n) => n && effectiveName && n.toLowerCase().trim() === effectiveName.toLowerCase().trim();
    
    // Prioritize matching by unique customerCode / customerId over string name comparison
    const matchingRecord = (rec) => {
      if (!rec) return false;
      const recCode = rec.customerCode || rec.customerId || rec.customer_id;
      if (effectiveCode && recCode) {
        return recCode.toLowerCase().trim() === effectiveCode.toLowerCase().trim();
      }
      return matchingName(rec.customerName || rec.clientName || rec.name);
    };

    // Aggregate matching records from all datasets
    const userPolicies = policies.filter(matchingRecord);
    const userInvestments = investments.filter(matchingRecord);
    const userClaims = claims.filter(matchingRecord);
    const userFollowups = followups.filter(matchingRecord);
    const userTasks = tasks.filter(matchingRecord);
    const userLeads = leads.filter(matchingRecord);

    // Consolidate policy renewals
    const userRenewals = userPolicies.map(p => ({
      id: `RNW-${p.id}`,
      policyNo: p.id,
      customerName: p.customerName || effectiveName,
      insuranceCompany: p.insuranceCompany,
      type: p.type,
      premiumAmount: p.grossPremium,
      dueDate: p.expiryDate,
      assignedStaff: p.assignedStaff,
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
      assignedAdvisorName: userPolicies[0]?.assignedStaff || userLeads[0]?.assignedStaff || 'Priya Sharma',
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
      userName: logData.userName || 'System User',
      userRole: logData.userRole || 'STAFF',
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
