import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { filterScopedRecords, canAccessCustomer } from '../utils/rbac';
import { db } from '../config/firebaseClient';
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext();


export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  // ─── FIRESTORE IS THE SINGLE SOURCE OF TRUTH ───────────────────────────────
  // All state initializes empty. onSnapshot listeners below fill them from
  // Firestore in real time. No localStorage reads for business data.
  const [rawCustomers, setCustomers] = useState([]);
  const [rawPolicies, setPolicies] = useState([]);
  const [rawInvestments, setInvestments] = useState([]);
  const [rawClaims, setClaims] = useState([]);
  const [rawLeads, setLeads] = useState([]);
  const [rawFollowups, setFollowups] = useState([]);
  const [rawTasks, setTasks] = useState([]);
  const [rawIncome, setIncome] = useState([]);
  const [rawExpenses, setExpenses] = useState([]);
  const [rawAuditLogs, setAuditLogs] = useState([]);
  const [rawUsers, setUsers] = useState([]);

  // ─── UNIFIED DATA LAYERS ───────────────────────────────────────────────────
  // Synthesizes policies from rawPolicies + customer profiles so that policies
  // defined on customers always appear in Policies Register & Policy Renewals
  const effectivePolicies = useMemo(() => {
    const list = [...rawPolicies];
    const existingCustIdsWithPolicies = new Set();
    const existingPolicyKeys = new Set();

    rawPolicies.forEach(p => {
      if (p.customerId) existingCustIdsWithPolicies.add(String(p.customerId).toLowerCase().trim());
      if (p.customerCode) existingCustIdsWithPolicies.add(String(p.customerCode).toLowerCase().trim());
      const key = `${String(p.customerName || '').toLowerCase().trim()}___${String(p.insuranceCompany || '').toLowerCase().trim()}`;
      existingPolicyKeys.add(key);
    });

    (rawCustomers || []).forEach((c, idx) => {
      const cId = String(c.id || c.customerCode || '').toLowerCase().trim();
      const cCode = String(c.customerCode || c.id || '').toLowerCase().trim();
      const cName = String(c.name || '').trim();
      
      const custPoliciesList = Array.isArray(c.policiesList) && c.policiesList.length > 0 ? c.policiesList : [];
      
      if (custPoliciesList.length > 0) {
        custPoliciesList.forEach((pol, pIdx) => {
          const polId = pol.id || pol.policyNo || `POL-${c.customerCode || c.id}-${pIdx + 1}`;
          if (!list.some(p => p.id === polId)) {
            list.push({
              ...pol,
              id: polId,
              policyNo: polId,
              customerId: c.id || c.customerCode,
              customerCode: c.customerCode || c.id,
              customerName: pol.customerName || cName,
              phone: pol.phone || c.phone || c.mobileNumber || '',
              insuranceCompany: pol.insuranceCompany || c.insuranceCompany || 'Tata AIA Life',
              type: pol.type || pol.category || c.insuranceType || 'Life Insurance',
              category: pol.type || pol.category || c.insuranceType || 'Life Insurance',
              policyName: pol.policyName || pol.planName || pol.salesPitch || c.policyName || c.salesPitch || 'Comprehensive Policy Plan',
              planName: pol.policyName || pol.planName || pol.salesPitch || c.policyName || c.salesPitch || 'Comprehensive Policy Plan',
              sumInsured: Number(pol.sumInsured || pol.sumAssured || c.sumInsured || c.policyAmount || 500000),
              grossPremium: Number(pol.grossPremium || pol.premium || c.policyAmount || 25000),
              premium: Number(pol.grossPremium || pol.premium || c.policyAmount || 25000),
              startDate: pol.startDate || c.policyStartDate || c.date || new Date().toISOString().split('T')[0],
              expiryDate: pol.expiryDate || pol.endDate || c.policyExpiryDate || c.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              assignedStaff: pol.assignedStaff || pol.assignedStaffName || c.assignedAdvisorName || c.assignedStaffName || c.assignedStaff || 'Advisor',
              assignedStaffName: pol.assignedStaffName || pol.assignedStaff || c.assignedStaffName || c.assignedAdvisorName || 'Advisor',
              assignedStaffId: pol.assignedStaffId || c.assignedStaffId || '',
              status: pol.status || c.policyStatus || 'ACTIVE',
              _fromCustomer: true
            });
          }
        });
      } else if (c.insuranceCompany || c.insuranceType || c.policyName || c.salesPitch || c.policyAmount) {
        const key = `${String(c.name || '').toLowerCase().trim()}___${String(c.insuranceCompany || '').toLowerCase().trim()}`;
        
        const alreadyInList = list.some(p => 
          (p.customerId && (String(p.customerId).toLowerCase().trim() === cId || String(p.customerId).toLowerCase().trim() === cCode)) ||
          (p.id && (p.id === c.policyNo || p.id === `POL-${c.id || c.customerCode}`)) ||
          (existingPolicyKeys.has(key) && key !== '___')
        );

        if (!alreadyInList) {
          const polId = c.policyNo || c.policyNumber || `POL-${c.customerCode || c.id || ('00' + (idx + 1))}`;
          list.push({
            id: polId,
            policyNo: polId,
            customerId: c.id || c.customerCode,
            customerCode: c.customerCode || c.id,
            customerName: cName,
            phone: c.phone || c.mobileNumber || '',
            insuranceCompany: c.insuranceCompany || 'Tata AIA Life',
            type: c.insuranceType || c.category || 'Life Insurance',
            category: c.insuranceType || c.category || 'Life Insurance',
            policyName: c.policyName || c.planName || c.salesPitch || 'Comprehensive Protection Plan',
            planName: c.policyName || c.planName || c.salesPitch || 'Comprehensive Protection Plan',
            salesPitch: c.salesPitch || '',
            sumInsured: Number(c.sumInsured || c.sumAssured || 500000),
            grossPremium: Number(c.policyAmount || c.grossPremium || c.premium || 25000),
            premium: Number(c.policyAmount || c.grossPremium || c.premium || 25000),
            startDate: c.policyStartDate || c.date || new Date().toISOString().split('T')[0],
            expiryDate: c.policyExpiryDate || c.expiryDate || c.renewalDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            assignedStaff: c.assignedAdvisorName || c.assignedStaffName || c.assignedStaff || 'Advisor',
            assignedStaffName: c.assignedStaffName || c.assignedAdvisorName || c.assignedStaff || 'Advisor',
            assignedStaffId: c.assignedStaffId || '',
            status: c.policyStatus || 'ACTIVE',
            clientStatus: c.clientStatus || 'Active',
            advisorNotes: c.advisorNotes || '',
            _fromCustomer: true
          });
        }
      }
    });

    return list;
  }, [rawPolicies, rawCustomers]);

  // Synthesizes investments from rawInvestments + customer portfolios
  const effectiveInvestments = useMemo(() => {
    const list = [...rawInvestments];
    (rawCustomers || []).forEach((c, idx) => {
      const cId = String(c.id || c.customerCode || '').toLowerCase().trim();
      const custInvestmentsList = Array.isArray(c.investmentsList) && c.investmentsList.length > 0 ? c.investmentsList : [];
      if (custInvestmentsList.length > 0) {
        custInvestmentsList.forEach((inv, iIdx) => {
          const invId = inv.id || `INV-${c.customerCode || c.id}-${iIdx + 1}`;
          if (!list.some(i => i.id === invId)) {
            list.push({
              ...inv,
              id: invId,
              customerId: c.id || c.customerCode,
              customerCode: c.customerCode || c.id,
              customerName: inv.customerName || c.name,
              provider: inv.provider || inv.amcName || 'HDFC Mutual Fund & AMC',
              type: inv.type || inv.category || 'SIP Mutual Fund',
              amount: Number(inv.amount || inv.sipAmount || 10000),
              folioNumber: inv.folioNumber || `FOL-${Math.floor(100000 + Math.random() * 900000)}`,
              status: inv.status || 'ACTIVE',
              advisorName: inv.advisorName || c.assignedAdvisorName || c.assignedStaffName || 'Advisor',
              date: inv.date || c.date || new Date().toISOString().split('T')[0],
              _fromCustomer: true
            });
          }
        });
      } else if (c.investmentProvider || c.amcName || c.mutualFunds || c.sipAmount || c.fdAmount || c.investmentAmount || (c.activePortfolios && c.activePortfolios.length > 0)) {
        const invId = c.investmentId || `INV-${c.customerCode || c.id || ('00' + (idx + 1))}`;
        if (!list.some(i => i.id === invId || (i.customerId && String(i.customerId).toLowerCase().trim() === cId))) {
          list.push({
            id: invId,
            customerId: c.id || c.customerCode,
            customerCode: c.customerCode || c.id,
            customerName: c.name,
            provider: c.investmentProvider || c.amcName || 'HDFC Mutual Fund & AMC',
            type: c.investmentType || (c.sipAmount ? 'SIP Mutual Fund' : (c.fdAmount ? 'Fixed Deposit' : 'Mutual Fund')),
            amount: Number(c.investmentAmount || c.sipAmount || c.fdAmount || c.totalPortfolioValue || 100000),
            folioNumber: c.folioNumber || `FOL-${Math.floor(100000 + Math.random() * 900000)}`,
            status: c.investmentStatus || 'ACTIVE',
            advisorName: c.assignedAdvisorName || c.assignedStaffName || 'Advisor',
            date: c.date || new Date().toISOString().split('T')[0],
            _fromCustomer: true
          });
        }
      }
    });
    return list;
  }, [rawInvestments, rawCustomers]);

  // Synthesizes claims from rawClaims + customer claims
  const effectiveClaims = useMemo(() => {
    const list = [...rawClaims];
    (rawCustomers || []).forEach((c, idx) => {
      const custClaimsList = Array.isArray(c.claimsList) && c.claimsList.length > 0 ? c.claimsList : [];
      if (custClaimsList.length > 0) {
        custClaimsList.forEach((clm, cIdx) => {
          const clmId = clm.id || `CLM-${c.customerCode || c.id}-${cIdx + 1}`;
          if (!list.some(x => x.id === clmId)) {
            list.push({
              ...clm,
              id: clmId,
              customerId: c.id || c.customerCode,
              customerCode: c.customerCode || c.id,
              customerName: clm.customerName || c.name,
              insuranceCompany: clm.insuranceCompany || c.insuranceCompany || 'Tata AIA Life',
              policyNo: clm.policyNo || c.policyNo || `POL-${c.customerCode || c.id}`,
              claimType: clm.claimType || 'Hospitalization Claim',
              claimAmount: Number(clm.claimAmount || 50000),
              settlementAmount: Number(clm.settlementAmount || 0),
              hospitalOrGarage: clm.hospitalOrGarage || 'City Hospital',
              assignedStaff: clm.assignedStaff || c.assignedAdvisorName || c.assignedStaffName || 'Advisor',
              status: clm.status || 'SUBMITTED',
              claimDate: clm.claimDate || c.date || new Date().toISOString().split('T')[0],
              _fromCustomer: true
            });
          }
        });
      }
    });
    return list;
  }, [rawClaims, rawCustomers]);

  // Dynamically scoped data views based on active user's authorized role & staff ID
  const customers = useMemo(() => filterScopedRecords(user, rawCustomers), [user, rawCustomers]);
  const policies = useMemo(() => filterScopedRecords(user, effectivePolicies), [user, effectivePolicies]);
  const investments = useMemo(() => filterScopedRecords(user, effectiveInvestments), [user, effectiveInvestments]);
  const claims = useMemo(() => filterScopedRecords(user, effectiveClaims), [user, effectiveClaims]);
  const leads = useMemo(() => filterScopedRecords(user, rawLeads), [user, rawLeads]);
  const followups = useMemo(() => filterScopedRecords(user, rawFollowups), [user, rawFollowups]);
  const tasks = useMemo(() => filterScopedRecords(user, rawTasks), [user, rawTasks]);
  const income = useMemo(() => (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' ? rawIncome : []), [user, rawIncome]);
  const expenses = useMemo(() => (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' ? rawExpenses : []), [user, rawExpenses]);
  const auditLogs = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      return rawAuditLogs;
    }
    return rawAuditLogs.filter(l => l.userName === user?.name || l.userRole === user?.role);
  }, [user, rawAuditLogs]);
  const staffList = useMemo(() => {
    return rawUsers;
  }, [rawUsers]);


  // ─── NO localStorage write-backs. Firestore onSnapshot is the only sync mechanism. ───

  // ─── FIRESTORE onSnapshot LISTENERS ────────────────────────────────────────
  // These are the ONLY way business data enters React state.
  // They update state on every Firestore change — including empty collections.
  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, 'customers'),
      (snap) => setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore customers error:', err));

    const unsubPolicies = onSnapshot(collection(db, 'policies'),
      (snap) => setPolicies(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore policies error:', err));

    const unsubInvestments = onSnapshot(collection(db, 'investments'),
      (snap) => setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore investments error:', err));

    const unsubClaims = onSnapshot(collection(db, 'claims'),
      (snap) => setClaims(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore claims error:', err));

    const unsubLeads = onSnapshot(collection(db, 'leads'),
      (snap) => setLeads(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore leads error:', err));

    const unsubFollowups = onSnapshot(collection(db, 'followups'),
      (snap) => setFollowups(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore followups error:', err));

    const unsubTasks = onSnapshot(collection(db, 'tasks'),
      (snap) => setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore tasks error:', err));

    const unsubIncome = onSnapshot(collection(db, 'income'),
      (snap) => setIncome(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore income error:', err));

    const unsubExpenses = onSnapshot(collection(db, 'expenses'),
      (snap) => setExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore expenses error:', err));

    const unsubAuditLogs = onSnapshot(collection(db, 'audit_logs'),
      (snap) => setAuditLogs(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => console.warn('Firestore audit_logs error:', err));

    const unsubUsers = onSnapshot(collection(db, 'users'),
      (snap) => {
        const uList = snap.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id }));
        setUsers(uList);
        if (uList.length > 0) {
          try {
            localStorage.setItem('crm_v2_users_list', JSON.stringify(uList));
            window.dispatchEvent(new Event('storage_users_updated'));
          } catch (e) { }
        }
      },
      (err) => console.warn('Firestore users error:', err));

    return () => {
      unsubCustomers(); unsubPolicies(); unsubInvestments(); unsubClaims();
      unsubLeads(); unsubFollowups(); unsubTasks(); unsubIncome(); unsubExpenses();
      unsubAuditLogs(); unsubUsers();
    };
  }, []);

  const sanitizeForFirestore = (data) => {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') return data;
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForFirestore(item));
    }
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  };

  const addAuditLog = async (logData) => {
    const id = logData?.id || `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog = {
      id,
      userName: logData?.userName || user?.name || 'System User',
      userRole: logData?.userRole || user?.role || 'STAFF',
      action: logData?.action || 'MUTATION',
      module: logData?.module || 'General',
      affectedRecord: logData?.affectedRecord || '-',
      timestamp: logData?.timestamp || new Date().toLocaleString('en-IN'),
      details: logData?.details || 'Action completed successfully',
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...(prev || []).filter(l => l.id !== id)]);
    try {
      await setDoc(doc(db, 'audit_logs', id), sanitizeForFirestore(newLog), { merge: true });
    } catch (e) {
      console.warn('Firestore audit_logs write error:', e);
    }
    return newLog;
  };

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
    const staffName = typeof staffInfo === 'string' ? staffInfo : (staffInfo.name || '');
    const staffUid = typeof staffInfo === 'string' ? '' : (staffInfo.uid || '');
    const staffEmail = typeof staffInfo === 'string' ? '' : (staffInfo.email || '');

    if (!staffName) return;

    const notifId = 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const byLine = assignedByName ? ` by ${assignedByName}` : '';

    const notifObj = {
      id: notifId,
      recipientId: staffUid,
      recipientName: staffName,
      recipientEmail: staffEmail,
      senderId: user?.uid || 'SYSTEM',
      senderName: user?.name || 'System Administrator',
      type: 'CUSTOMER_ASSIGNED',
      title: isReassignment
        ? '👤 Customer Portfolio Reassigned to You'
        : '👤 New Customer Assigned to Your Portfolio!',
      message: isReassignment
        ? `Customer "${customerName}" has been reassigned to your portfolio${byLine}. Please reach out and introduce yourself.`
        : `New customer "${customerName}" has been added and assigned to your portfolio${byLine}. Schedule a welcome call within 24 hours.`,
      isRead: false,
      read: false,
      createdAt: new Date().toISOString()
    };

    // 1. Persist to localStorage + dispatch event → bell icon updates immediately
    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      localStorage.setItem('crm_v2_notifications', JSON.stringify([notifObj, ...stored]));
      window.dispatchEvent(new CustomEvent('storage_notifications_updated', { detail: notifObj }));
    } catch (e) { }

    // 2. Write to Firestore for cloud persistence & cross-device sync
    try {
      await setDoc(doc(db, 'notifications', notifObj.id), {
        ...notifObj,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { }

    // 3. Legacy event for any other listeners
    try {
      window.dispatchEvent(new CustomEvent('storage_customer_assigned', {
        detail: { advisorName: staffName, customerName }
      }));
    } catch (e) { }

    // 4. Auto-create a Task for the assigned staff
    //    (setTasks is available via closure; it's initialized before this is ever called)
    try {
      const taskDue = new Date();
      taskDue.setDate(taskDue.getDate() + 1); // Due tomorrow

      const autoTask = {
        id: 'TASK-AUTO-' + Date.now(),
        title: isReassignment
          ? `📋 Follow up with reassigned customer: ${customerName}`
          : `📞 Welcome call – New customer: ${customerName}`,
        description: isReassignment
          ? `${customerName} has been reassigned to your portfolio${byLine}. Introduce yourself and confirm their policy details.`
          : `${customerName} is newly assigned to your portfolio${byLine}. Schedule an introductory call and collect any outstanding documents.`,
        customerName,
        assignedStaff: staffName,
        assignedStaffId: staffUid,
        assignedTo: staffName,
        staffId: staffUid,
        dueDate: taskDue.toISOString().split('T')[0],
        priority: 'HIGH',
        status: 'PENDING',
        type: 'CUSTOMER_ASSIGNMENT',
        autoGenerated: true,
        createdAt: new Date().toISOString()
      };

      setTasks(prev => [autoTask, ...(prev || [])]);
      try { createTaskBackend(autoTask); } catch (_) { }
    } catch (e) { }
  };

  // ─── CRUD ACTIONS ───────────────────────────────────────────────────────────
  // Every mutation writes to Firestore first. onSnapshot propagates the change
  // to all devices automatically. No localStorage fallbacks for business data.

  const addCustomer = async (custData) => {
    const id = custData.id || `SK-CUST-${Date.now()}`;
    const assignedStaffId = custData.assignedStaffId || custData.staffId || user?.uid || '';
    const assignedStaffName = custData.assignedStaffName || custData.assignedAdvisorName || custData.assignedStaff || user?.name || '';
    const assignedStaffEmail = custData.assignedStaffEmail || custData.advisorEmail || user?.email || '';
    const branchId = custData.branchId || custData.branch || user?.branchId || '';

    const newCust = {
      ...custData,
      id,
      customerCode: id,
      assignedStaffId,
      assignedStaffName,
      assignedAdvisorName: assignedStaffName,
      assignedStaffEmail,
      branchId,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || '',
      createdByUid: user?.uid || ''
    };

    // Optimistically update state so customer appears immediately in UI
    setCustomers(prev => [newCust, ...(prev || []).filter(c => c.id !== id)]);

    // Write to Firestore with sanitized fields
    const payload = sanitizeForFirestore(newCust);
    await setDoc(doc(db, 'customers', id), payload, { merge: true });

    // Auto-create linked policy in Firestore 'policies' collection if insurance company is provided
    if (newCust.insuranceCompany) {
      const polId = newCust.policyNo || `POL-${id}`;
      const polObj = {
        id: polId,
        policyNo: polId,
        customerId: id,
        customerCode: id,
        customerName: newCust.name,
        phone: newCust.phone || newCust.mobileNumber || '',
        insuranceCompany: newCust.insuranceCompany,
        type: newCust.insuranceType || 'Life Insurance',
        category: newCust.insuranceType || 'Life Insurance',
        policyName: newCust.policyName || newCust.planName || newCust.salesPitch || 'Comprehensive Protection Plan',
        planName: newCust.policyName || newCust.planName || newCust.salesPitch || 'Comprehensive Protection Plan',
        salesPitch: newCust.salesPitch || '',
        sumInsured: Number(newCust.sumInsured || newCust.sumAssured || 500000),
        grossPremium: Number(newCust.policyAmount || newCust.grossPremium || 25000),
        premium: Number(newCust.policyAmount || newCust.grossPremium || 25000),
        startDate: newCust.date || new Date().toISOString().split('T')[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        assignedStaffId,
        assignedStaffName,
        assignedStaff: assignedStaffName,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'policies', polId), sanitizeForFirestore(polObj), { merge: true });
      } catch (e) {
        console.warn('Auto policy write error:', e);
      }
    }

    try {
      if (newCust.assignedStaffName || newCust.assignedAdvisorName) {
        notifyCustomerAssignment(
          { uid: newCust.assignedStaffId, name: newCust.assignedStaffName || newCust.assignedAdvisorName, email: newCust.assignedStaffEmail },
          newCust.name, false, user?.name
        );
      }
    } catch (e) { }

    try {
      addAuditLog({
        userName: user?.name || 'Staff Advisor',
        userRole: user?.role || 'STAFF',
        action: 'CREATE_CLIENT',
        module: 'Customers',
        affectedRecord: `${newCust.name} (${newCust.customerCode})`,
        details: `Created customer profile assigned to ${assignedStaffName}`
      });
    } catch (e) { }

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
        const finalStaffId = incomingStaffId ? incomingStaffId : c.assignedStaffId;
        const finalStaffName = updateObj.assignedStaffName || updateObj.assignedAdvisorName || updateObj.assignedStaff || c.assignedStaffName;

        finalUpdatedRecord = {
          ...c,
          ...updateObj,
          assignedStaffId: finalStaffId,
          assignedStaffName: finalStaffName,
          assignedAdvisorName: finalStaffName,
        };
        return finalUpdatedRecord;
      }
      return c;
    }));

    // Write directly to Firestore — onSnapshot propagates change to all devices
    if (finalUpdatedRecord) {
      try {
        await setDoc(doc(db, 'customers', String(targetId)), finalUpdatedRecord, { merge: true });
      } catch (e) {
        console.warn('Firestore updateCustomer error:', e);
      }
    }

    // Notify on any staff name change (e.g. toast/bell notification)
    const newName = updateObj.assignedStaffName || updateObj.assignedAdvisorName || updateObj.assignedStaff;
    const newUid = updateObj.assignedStaffId || updateObj.staffId || '';
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
        userName: user?.name || 'Admin',
        userRole: user?.role || 'ADMIN',
        action: 'REASSIGN_CUSTOMER',
        module: 'Customers',
        affectedRecord: `${updateObj.name || String(targetId)} (${targetId})`,
        details: `Staff reassigned from "${reassignmentMeta.previousStaffName}" [${reassignmentMeta.previousStaffId}] → "${reassignmentMeta.newStaffName}" [${reassignmentMeta.newStaffId}]`
      });
    } else {
      addAuditLog({
        userName: user?.name || 'Staff Advisor',
        userRole: user?.role || 'STAFF',
        action: 'UPDATE_CUSTOMER',
        module: 'Customers',
        affectedRecord: String(targetId),
        details: 'Updated customer profile details & relationships'
      });
    }
  };

  const deleteCustomer = async (id) => {
    if (!id) return;

    // Find the customer to get identifiers (name, customerCode, phone, id)
    const targetCust = rawCustomers.find(c => String(c.id) === String(id) || String(c.customerCode) === String(id));
    const targetName = (targetCust?.name || '').trim().toLowerCase();
    const targetCode = String(targetCust?.customerCode || targetCust?.id || id).trim().toLowerCase();
    const targetPhone = String(targetCust?.phone || targetCust?.mobileNumber || '').replace(/\D/g, '');

    const isRecordMatched = (rec) => {
      if (!rec) return false;
      const recCustId = String(rec.customerId || rec.customer_id || rec.customerCode || '').trim().toLowerCase();
      if (recCustId && (recCustId === targetCode || recCustId === String(id).trim().toLowerCase())) {
        return true;
      }
      const recCustName = String(rec.customerName || rec.clientName || rec.name || '').trim().toLowerCase();
      if (targetName && recCustName && recCustName === targetName) {
        return true;
      }
      const recPhone = String(rec.phone || rec.mobileNumber || rec.customerPhone || '').replace(/\D/g, '');
      if (targetPhone && targetPhone.length >= 7 && recPhone && recPhone === targetPhone) {
        return true;
      }
      return false;
    };

    // 1. Delete all linked policies from Firestore
    const linkedPolicies = rawPolicies.filter(isRecordMatched);
    const linkedPolicyIds = new Set(linkedPolicies.map(p => String(p.id)));
    for (const pol of linkedPolicies) {
      try {
        await deleteDoc(doc(db, 'policies', String(pol.id)));
      } catch (e) {
        console.warn('Firestore delete policy error:', pol.id, e);
      }
    }

    // 2. Delete all linked investments from Firestore
    const linkedInvestments = rawInvestments.filter(isRecordMatched);
    for (const inv of linkedInvestments) {
      try {
        await deleteDoc(doc(db, 'investments', String(inv.id)));
      } catch (e) {
        console.warn('Firestore delete investment error:', inv.id, e);
      }
    }

    // 3. Delete all linked claims from Firestore
    const linkedClaims = rawClaims.filter(c => {
      if (isRecordMatched(c)) return true;
      if (c.policyNo && (linkedPolicyIds.has(String(c.policyNo)) || linkedPolicies.some(p => p.policyNo === c.policyNo))) {
        return true;
      }
      return false;
    });
    for (const clm of linkedClaims) {
      try {
        await deleteDoc(doc(db, 'claims', String(clm.id)));
      } catch (e) {
        console.warn('Firestore delete claim error:', clm.id, e);
      }
    }

    // 4. Delete all linked followups from Firestore
    const linkedFollowups = rawFollowups.filter(isRecordMatched);
    for (const flw of linkedFollowups) {
      try {
        await deleteDoc(doc(db, 'followups', String(flw.id)));
      } catch (e) {
        console.warn('Firestore delete followup error:', flw.id, e);
      }
    }

    // 5. Delete all linked tasks from Firestore
    const linkedTasks = rawTasks.filter(isRecordMatched);
    for (const tsk of linkedTasks) {
      try {
        await deleteDoc(doc(db, 'tasks', String(tsk.id)));
      } catch (e) {
        console.warn('Firestore delete task error:', tsk.id, e);
      }
    }

    // 6. Delete the customer document from Firestore — onSnapshot propagates deletion to all devices
    try {
      await deleteDoc(doc(db, 'customers', String(id)));
    } catch (e) {
      console.warn('Firestore deleteCustomer error:', e);
    }

    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_CLIENT_CASCADE',
      module: 'Customers',
      affectedRecord: `${targetCust?.name || id} (Purged ${linkedPolicies.length} policies, ${linkedInvestments.length} investments, ${linkedClaims.length} claims)`,
      details: `Permanently purged customer profile and all linked records (${linkedPolicies.length} policies, ${linkedInvestments.length} investments, ${linkedClaims.length} claims, ${linkedFollowups.length} follow-ups, ${linkedTasks.length} tasks).`
    });
  };


  const addPolicy = async (polData) => {
    const id = polData.id || `POL-SK-${Date.now()}`;
    const assignedStaffId = polData.assignedStaffId || polData.staffId || user?.uid || '';
    const assignedStaffName = polData.assignedStaffName || polData.assignedStaff || user?.name || '';

    const newPol = {
      ...polData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      startDate: polData.startDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: user?.name || '',
      createdByUid: user?.uid || ''
    };

    // Write to Firestore — onSnapshot propagates to all devices
    await setDoc(doc(db, 'policies', id), newPol, { merge: true });

    // Update linked customer record in Firestore
    const linkedCust = rawCustomers.find(c =>
      (c.name && c.name.toLowerCase().trim() === (newPol.customerName || '').toLowerCase().trim()) ||
      (newPol.customerId && (c.id === newPol.customerId || c.customerCode === newPol.customerId))
    );
    if (linkedCust) {
      const updatedCust = {
        ...linkedCust,
        insuranceCompany: newPol.insuranceCompany || linkedCust.insuranceCompany,
        insuranceType: newPol.type || linkedCust.insuranceType,
        policyName: newPol.policyName || newPol.planName || linkedCust.policyName,
        policyAmount: Number(newPol.grossPremium || linkedCust.policyAmount || 0),
        activePoliciesCount: (linkedCust.activePoliciesCount || 0) + 1,
        totalPortfolioValue: (Number(linkedCust.totalPortfolioValue || 0) + Number(newPol.sumInsured || 0))
      };
      try { await setDoc(doc(db, 'customers', String(linkedCust.id)), updatedCust, { merge: true }); } catch (_) { }
    }

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

  const deletePolicy = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, 'policies', String(id)));
    // onSnapshot will remove it from state on all devices
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_POLICY',
      module: 'Policies',
      affectedRecord: String(id),
      details: `Deleted policy record ${id}`
    });
  };

  const updatePolicy = async (updatedPol) => {
    if (!updatedPol || !updatedPol.id) return;
    const cleanPol = {
      ...updatedPol,
      grossPremium: parseFloat(updatedPol.grossPremium || updatedPol.premium || 0),
      sumInsured: parseFloat(updatedPol.sumInsured || updatedPol.sumAssured || 0),
      updatedAt: new Date().toISOString()
    };
    setPolicies(prev => prev.map(p => p.id === cleanPol.id ? { ...p, ...cleanPol } : p));
    try { await setDoc(doc(db, 'policies', String(cleanPol.id)), cleanPol, { merge: true }); } catch (e) { console.warn('Firestore updatePolicy error:', e); }
    addAuditLog({
      userName: user?.name || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'UPDATE_POLICY',
      module: 'Policies',
      affectedRecord: `${cleanPol.insuranceCompany} (${cleanPol.id})`,
      details: `Updated policy for ${cleanPol.customerName}: Premium ₹${cleanPol.grossPremium}, Coverage ₹${cleanPol.sumInsured}`
    });
    return cleanPol;
  };

 const clearAllPolicies = async () => {
    // Note: does not bulk-delete Firestore docs. Used for UI reset only.
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'CLEAR_ALL_POLICIES',
      module: 'Policies',
      affectedRecord: 'All Policies',
      details: 'Initiated policy register clear'
    });
  };

  const addInvestment = async (invData) => {
    const id = invData.id || `INV-SK-${Date.now()}`;
    const assignedStaffId = invData.assignedStaffId || invData.staffId || user?.uid || '';
    const assignedStaffName = invData.assignedStaffName || invData.advisorName || user?.name || '';

    const newInv = {
      ...invData,
      id,
      assignedStaffId,
      assignedStaffName,
      status: invData.status || 'PENDING',
      date: invData.date || new Date().toISOString().split('T')[0]
    };

    // Write to Firestore — onSnapshot propagates to all devices
    await setDoc(doc(db, 'investments', id), newInv, { merge: true });
    return newInv;
  };

  const updateInvestmentStatus = async (id, newStatus) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    try { await setDoc(doc(db, 'investments', id), { status: newStatus }, { merge: true }); } catch (e) { }
  };

  const deleteInvestment = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, 'investments', String(id)));
    // onSnapshot removes it from state on all devices
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_INVESTMENT',
      module: 'Investments',
      affectedRecord: String(id),
      details: `Deleted investment record ${id}`
    });
  };

  const addClaim = async (claimData) => {
    const id = claimData.id || `CLM-SK-${Date.now()}`;
    const assignedStaffId = claimData.assignedStaffId || claimData.staffId || user?.uid || '';
    const assignedStaffName = claimData.assignedStaffName || claimData.assignedStaff || user?.name || '';

    const newClaim = {
      ...claimData,
      id,
      claimAmount: parseFloat(claimData.claimAmount || claimData.amount || 0),
      settlementAmount: parseFloat(claimData.settlementAmount || 0),
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      claimDate: claimData.claimDate || new Date().toISOString().split('T')[0],
      status: claimData.status || 'SUBMITTED',
      createdAt: new Date().toISOString()
    };

    setClaims(prev => [newClaim, ...prev]);
    try { await setDoc(doc(db, 'claims', id), newClaim, { merge: true }); } catch (e) { }

    addAuditLog({
      userName: user?.name || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'CREATE_CLAIM',
      module: 'Claims',
      affectedRecord: `${id} - ${newClaim.customerName}`,
      details: `Filed claim of ₹${newClaim.claimAmount} for policy ${newClaim.policyNo || 'N/A'} (${newClaim.insuranceCompany || 'Provider'})`
    });
    return newClaim;
  };

  const updateClaim = async (updatedClaim) => {
    if (!updatedClaim || !updatedClaim.id) return;
    const cleanObj = {
      ...updatedClaim,
      claimAmount: parseFloat(updatedClaim.claimAmount || updatedClaim.amount || 0),
      settlementAmount: parseFloat(updatedClaim.settlementAmount || 0),
      updatedAt: new Date().toISOString()
    };

    setClaims(prev => prev.map(clm => clm.id === cleanObj.id ? { ...clm, ...cleanObj } : clm));
    try { await setDoc(doc(db, 'claims', cleanObj.id), cleanObj, { merge: true }); } catch (e) { }

    addAuditLog({
      userName: user?.name || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'UPDATE_CLAIM',
      module: 'Claims',
      affectedRecord: `${cleanObj.id} - ${cleanObj.customerName}`,
      details: `Updated claim status to ${cleanObj.status || 'SUBMITTED'}, Settlement ₹${cleanObj.settlementAmount || 0}`
    });
    return cleanObj;
  };

  const updateClaimStatus = async (id, newStatus) => {
    setClaims(prev => prev.map(clm => clm.id === id ? { ...clm, status: newStatus, updatedAt: new Date().toISOString() } : clm));
    try { await setDoc(doc(db, 'claims', id), { status: newStatus, updatedAt: new Date().toISOString() }, { merge: true }); } catch (e) { }
    addAuditLog({
      userName: user?.name || 'Staff Advisor',
      userRole: user?.role || 'STAFF',
      action: 'UPDATE_CLAIM_STATUS',
      module: 'Claims',
      affectedRecord: String(id),
      details: `Changed claim status to ${newStatus}`
    });
  };

  const deleteClaim = async (id) => {
    if (!id) return;
    setClaims(prev => prev.filter(c => c.id !== id));
    try { await deleteDoc(doc(db, 'claims', id)); } catch (e) { }
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_CLAIM',
      module: 'Claims',
      affectedRecord: String(id),
      details: `Deleted claim record ${id}`
    });
  };

  const addLead = async (leadData) => {
    const id = leadData.id || `LD-SK-${Date.now()}`;
    const assignedStaffId = leadData.assignedStaffId || leadData.staffId || user?.uid || '';
    const assignedStaffName = leadData.assignedStaffName || leadData.assignedStaff || user?.name || '';

    const newLead = {
      ...leadData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      createdDate: new Date().toISOString().split('T')[0]
    };

    await setDoc(doc(db, 'leads', id), newLead, { merge: true });
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
    try { await setDoc(doc(db, 'leads', leadId), { leadStatus: 'CONVERTED' }, { merge: true }); } catch (e) { }
  };

  const addFollowup = async (flwData) => {
    const id = flwData.id || `FLW-SK-${Date.now()}`;
    const assignedStaffId = flwData.assignedStaffId || flwData.staffId || user?.uid || '';
    const assignedStaffName = flwData.assignedStaffName || flwData.assignedTo || user?.name || '';

    const newFlw = {
      ...flwData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedTo: assignedStaffName,
      createdBy: user?.name || 'Staff Advisor',
      status: 'PENDING'
    };

    await setDoc(doc(db, 'followups', id), newFlw, { merge: true });
    return newFlw;
  };

  const addTask = async (taskData) => {
    const id = taskData.id || `TSK-SK-${Date.now()}`;
    const assignedStaffId = taskData.assignedStaffId || taskData.staffId || user?.uid || '';
    const assignedStaffName = taskData.assignedStaffName || taskData.assignedStaff || user?.name || '';

    const newTask = {
      ...taskData,
      id,
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      status: 'PENDING'
    };

    await setDoc(doc(db, 'tasks', id), newTask, { merge: true });
    return newTask;
  };

  const updateTaskStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try { await setDoc(doc(db, 'tasks', id), { status: newStatus }, { merge: true }); } catch (e) { }
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', String(id)));
    // onSnapshot removes it from state on all devices
    addAuditLog({
      action: 'DELETE_TASK',
      module: 'Tasks',
      affectedRecord: String(id),
      details: `Task ID ${id} deleted by Admin/Manager`
    });
  };

  const addIncome = async (incData) => {
    const id = incData.id || `INC-SK-${Date.now()}`;
    const newInc = { ...incData, id, date: incData.date || new Date().toISOString().split('T')[0] };
    await setDoc(doc(db, 'income', id), newInc, { merge: true });
    return newInc;
  };

  const addExpense = async (expData) => {
    const id = expData.id || `EXP-SK-${Date.now()}`;
    const newExp = { ...expData, id, date: expData.date || new Date().toISOString().split('T')[0] };
    await setDoc(doc(db, 'expenses', id), newExp, { merge: true });
    return newExp;
  };

  const deleteExpense = async (id) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'expenses', String(id)));
    } catch (e) {
      console.warn('Firestore deleteExpense error:', e);
    }
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_EXPENSE',
      module: 'Expenses',
      affectedRecord: String(id),
      details: `Permanently deleted expense record ${id}`
    });
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

    const effectivePhone = String(masterCustomer?.phone || masterCustomer?.mobileNumber || '').replace(/\D/g, '');

    const matchingRecord = (rec) => {
      if (!rec) return false;
      // 1. Code match (customerCode / customerId stored on the record)
      const recCode = String(rec.customerCode || rec.customerId || rec.customer_id || '').toLowerCase().trim();
      if (effectiveCode && recCode && recCode === effectiveCode.toLowerCase().trim()) return true;
      // 2. Name match (customerName / clientName stored on the record)
      const recName = String(rec.customerName || rec.clientName || rec.name || '').toLowerCase().trim();
      if (effectiveName && recName && recName === effectiveName.toLowerCase().trim()) return true;
      // 3. Phone match (policies may store phone from customer)
      if (effectivePhone && effectivePhone.length >= 7) {
        const recPhone = String(rec.phone || rec.mobileNumber || rec.customerPhone || '').replace(/\D/g, '');
        if (recPhone && recPhone === effectivePhone) return true;
      }
      return false;
    };

    let userPolicies = rawPolicies.filter(matchingRecord);

    // ── FALLBACK: Synthesize from embedded customer fields ──────────────────
    // Older customers may have policy data stored directly on the customer
    // document (insuranceCompany, policyName, policyAmount, etc.) instead of
    // as separate documents in the "policies" collection.
    // Build synthetic policy entries so the Policies tab always shows something.
    if (userPolicies.length === 0 && masterCustomer) {
      const c = masterCustomer;
      // Handle multiple embedded policies stored as arrays or single fields
      const companies = Array.isArray(c.insuranceCompanies) ? c.insuranceCompanies
                        : c.insuranceCompany ? [c.insuranceCompany] : [];
      companies.forEach((company, i) => {
        if (!company) return;
        userPolicies.push({
          id: c.policyNo || c.policyNumber || `EMB-${c.id || c.customerCode}-${i}`,
          customerName: c.name,
          customerId: c.id || c.customerCode,
          insuranceCompany: company,
          type: Array.isArray(c.insuranceTypes) ? c.insuranceTypes[i] : (c.insuranceType || c.type || 'Insurance'),
          category: c.insuranceType || c.type || 'Insurance',
          policyName: Array.isArray(c.policyNames) ? c.policyNames[i] : (c.policyName || c.planName || ''),
          planName: c.policyName || c.planName || '',
          sumInsured: Number(c.sumInsured || c.sumAssured || c.coverageAmount || 0),
          grossPremium: Number(c.grossPremium || c.policyAmount || c.premium || c.annualPremium || 0),
          premium: Number(c.grossPremium || c.policyAmount || c.premium || c.annualPremium || 0),
          startDate: c.policyStartDate || c.startDate || '',
          expiryDate: c.policyExpiryDate || c.expiryDate || c.renewalDate || '',
          status: c.policyStatus || 'ACTIVE',
          assignedStaff: c.assignedAdvisorName || c.assignedStaffName || '',
          assignedStaffName: c.assignedStaffName || c.assignedAdvisorName || '',
          phone: c.phone || '',
          _embedded: true   // flag to distinguish from real policy docs
        });
      });
    }

    const userInvestments = rawInvestments.filter(matchingRecord);
    const userClaims = rawClaims.filter(matchingRecord);
    const userTasks = rawTasks.filter(matchingRecord);
    const userLeads = rawLeads.filter(matchingRecord);

    // followup_hubs and spreadsheet_followups are now in Firestore (via Followups.jsx onSnapshot)
    // We use rawFollowups from Firestore state for Customer 360 linking
    const matchingHubs = [];
    const matchingSpreadsheet = [];

    const hubSteps = matchingHubs.flatMap(h =>
      (h.history || []).map(step => ({
        id: step.stepId || `FLW-${step.stageName}`,
        stageName: step.stageName,
        date: step.date,
        assignedTo: step.assignedTo,
        createdBy: step.createdBy,
        conversationNotes: step.conversationNotes,
        status: step.status,
        overallStatus: h.overallStatus,
        activeProduct: h.activeProduct,
        clientId: h.clientId,
        clientName: h.clientName,
        source: 'PROGRESSION_HUB'
      }))
    );

    const spreadsheetSteps = matchingSpreadsheet.map(s => ({
      id: s.id || `FLW-SP-${Math.random()}`,
      stageName: `${s.clientStatus} (${s.insuranceType || 'General'})`,
      date: s.date,
      assignedTo: s.insuranceCompany || 'Staff Officer',
      createdBy: s.clientCategory || 'Register',
      conversationNotes: s.advisorNotes || s.salesPitch,
      status: s.clientStatus,
      clientName: s.clientName,
      source: 'REGISTER'
    }));

    const rawMatched = rawFollowups.filter(matchingRecord);
    const userFollowups = [...hubSteps, ...spreadsheetSteps, ...rawMatched];
    const userFollowupHub = matchingHubs[0] || null;

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
      alternatePhone: userPolicies[0]?.alternatePhone || userInvestments[0]?.alternatePhone || '',
      altPhone: userPolicies[0]?.alternatePhone || userInvestments[0]?.alternatePhone || '',
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
      followupHub: userFollowupHub,
      tasksList: userTasks,
      leadsList: userLeads
    };
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
      updatePolicy,
      deletePolicy,
      clearAllPolicies,
      addInvestment,
      updateInvestmentStatus,
      deleteInvestment,
      addClaim,
      updateClaim,
      updateClaimStatus,
      deleteClaim,
      addLead,
      convertLeadToCustomer,
      addFollowup,
      addTask,
      updateTaskStatus,
      deleteTask,
      addIncome,
      addExpense,
      deleteExpense,
      addAuditLog,
      getCustomerAggregatedDetails,
      staffList,
      users: staffList
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
