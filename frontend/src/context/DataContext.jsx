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

const initialCustomersSeed = [];
const initialPoliciesSeed = [];
const initialInvestmentsSeed = [];
const initialClaimsSeed = [];
const initialLeadsSeed = [];
const initialFollowupsSeed = [];
const initialTasksSeed = [];

const getDeletedCustomerIds = () => {
  try {
    const saved = localStorage.getItem('crm_v2_deleted_customer_ids');
    const parsed = saved ? JSON.parse(saved) : [];
    const seedIds = ['CUST-101', 'SK-CUST-101', 'Rahul Sharma', 'CUST-102', 'SK-CUST-102', 'Priya Menon', 'CUST-103', 'SK-CUST-103', 'Anand Kumar'];
    return Array.from(new Set([...parsed, ...seedIds]));
  } catch (e) {
    return ['CUST-101', 'SK-CUST-101', 'Rahul Sharma', 'CUST-102', 'SK-CUST-102', 'Priya Menon', 'CUST-103', 'SK-CUST-103', 'Anand Kumar'];
  }
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [rawCustomers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('crm_v2_customers');
    const deletedIds = getDeletedCustomerIds();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(c =>
            !deletedIds.includes(String(c.id)) &&
            !deletedIds.includes(String(c.customerCode)) &&
            !deletedIds.includes(String(c.name))
          );
        }
      } catch (e) { }
    }
    return initialCustomersSeed.filter(c =>
      !deletedIds.includes(String(c.id)) &&
      !deletedIds.includes(String(c.customerCode)) &&
      !deletedIds.includes(String(c.name))
    );
  });

  const [rawPolicies, setPolicies] = useState(() => {
    try {
      localStorage.setItem('crm_v2_policies', JSON.stringify([]));
    } catch (e) { }
    return [];
  });

  const [rawInvestments, setInvestments] = useState(() => {
    const saved = localStorage.getItem('crm_v2_investments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(i =>
            !['INV-2001', 'INV-2002', 'INV-2003'].includes(i.id) &&
            !['Rahul Sharma', 'Priya Menon', 'Anand Kumar'].includes(i.customerName)
          );
        }
      } catch (e) { }
    }
    return [];
  });

  const [rawClaims, setClaims] = useState(() => {
    const saved = localStorage.getItem('crm_v2_claims');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(c =>
            !['CLM-3001', 'CLM-3002'].includes(c.id) &&
            !['Rahul Sharma', 'Priya Menon', 'Anand Kumar'].includes(c.customerName)
          );
        }
      } catch (e) { }
    }
    return [];
  });

  const [rawLeads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm_v2_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(l =>
            !['LD-4001', 'LD-4002'].includes(l.id) &&
            !['Sanjay Gupta', 'Deepak Verma'].includes(l.customerName)
          );
        }
      } catch (e) { }
    }
    return [];
  });

  const [rawFollowups, setFollowups] = useState(() => {
    const saved = localStorage.getItem('crm_v2_followups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(f =>
            !['FLW-5001', 'FLW-5002'].includes(f.id) &&
            !['Rahul Sharma', 'Priya Menon', 'Anand Kumar'].includes(f.customerName)
          );
        }
      } catch (e) { }
    }
    return [];
  });

  const [rawTasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('crm_v2_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t =>
            !['TSK-6001', 'TSK-6002'].includes(t.id) &&
            !['Rahul Sharma', 'Priya Menon', 'Anand Kumar'].includes(t.customerName)
          );
        }
      } catch (e) { }
    }
    return [];
  });

  const [rawIncome, setIncome] = useState(() => {
    const saved = localStorage.getItem('crm_v2_income');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  const [rawExpenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('crm_v2_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  const [rawAuditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('crm_v2_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
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
  useEffect(() => { localStorage.setItem('crm_v2_audit_logs', JSON.stringify(rawAuditLogs)); }, [rawAuditLogs]);
  useEffect(() => {
    localStorage.setItem('crm_v2_customers', JSON.stringify(rawCustomers));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_customers' } }));
  }, [rawCustomers]);
  useEffect(() => {
    localStorage.setItem('crm_v2_policies', JSON.stringify(rawPolicies));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_policies' } }));
  }, [rawPolicies]);
  useEffect(() => { localStorage.setItem('crm_v2_investments', JSON.stringify(rawInvestments)); }, [rawInvestments]);
  useEffect(() => { localStorage.setItem('crm_v2_claims', JSON.stringify(rawClaims)); }, [rawClaims]);
  useEffect(() => { localStorage.setItem('crm_v2_leads', JSON.stringify(rawLeads)); }, [rawLeads]);
  useEffect(() => { localStorage.setItem('crm_v2_followups', JSON.stringify(rawFollowups)); }, [rawFollowups]);
  useEffect(() => {
    localStorage.setItem('crm_v2_tasks', JSON.stringify(rawTasks));
    window.dispatchEvent(new CustomEvent('crm_data_updated', { detail: { key: 'crm_v2_tasks' } }));
  }, [rawTasks]);
  useEffect(() => { localStorage.setItem('crm_v2_income', JSON.stringify(rawIncome)); }, [rawIncome]);
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
      } catch (e) { }
    };

    // Native storage event fires across browser tabs (different-tab updates)
    const handleStorageEvent = (e) => {
      if (e.key === 'crm_v2_customers') reloadFromStorage('crm_v2_customers', setCustomers);
      if (e.key === 'crm_v2_policies') reloadFromStorage('crm_v2_policies', setPolicies);
      if (e.key === 'crm_v2_tasks') reloadFromStorage('crm_v2_tasks', setTasks);
      if (e.key === 'crm_v2_leads') reloadFromStorage('crm_v2_leads', setLeads);
      if (e.key === 'crm_v2_followups') reloadFromStorage('crm_v2_followups', setFollowups);
      if (e.key === 'crm_v2_investments') reloadFromStorage('crm_v2_investments', setInvestments);
      if (e.key === 'crm_v2_claims') reloadFromStorage('crm_v2_claims', setClaims);
    };

    // crm_data_updated fires within the same tab when WE write (storage event doesn't)
    // This covers the case where admin assigns while staff is on the same browser session
    const handleCrmUpdate = (e) => {
      const key = e?.detail?.key;
      if (key === 'crm_v2_customers') reloadFromStorage('crm_v2_customers', setCustomers);
      if (key === 'crm_v2_policies') reloadFromStorage('crm_v2_policies', setPolicies);
      if (key === 'crm_v2_tasks') reloadFromStorage('crm_v2_tasks', setTasks);
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('crm_data_updated', handleCrmUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('crm_data_updated', handleCrmUpdate);
    };
  }, []);

  useEffect(() => {
    try {
      const sampleNames = ['Rahul Sharma', 'Priya Menon', 'Anand Kumar', 'Sanjay Gupta', 'Deepak Verma'];
      const sampleIds = ['CUST-101', 'CUST-102', 'CUST-103', 'POL-1001', 'POL-1002', 'POL-1003', 'INV-2001', 'INV-2002', 'INV-2003', 'CLM-3001', 'CLM-3002', 'LD-4001', 'LD-4002', 'FLW-5001', 'FLW-5002', 'TSK-6001', 'TSK-6002'];
      const keysToClean = [
        'crm_v2_customers',
        'crm_v2_policies',
        'crm_v2_investments',
        'crm_v2_claims',
        'crm_v2_leads',
        'crm_v2_followups',
        'crm_v2_tasks',
        'crm_v2_income',
        'crm_v2_audit_logs',
        'crm_v2_client_followup_hubs',
        'crm_v2_spreadsheet_followups'
      ];
      keysToClean.forEach(key => {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(item => {
                const name = item.name || item.customerName || item.clientName || '';
                const id = item.id || item.clientId || item.policyNo || '';
                return !sampleNames.includes(name) && !sampleIds.includes(id);
              });
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          } catch (e) { }
        }
      });
    } catch (e) { }
  }, []);

  // Real-time Firestore snapshot listeners for zero-latency cross-device database synchronization
  useEffect(() => {
    // 1. Customers
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      if (!snap.empty) {
        const deletedIds = getDeletedCustomerIds();
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c =>
            !deletedIds.includes(String(c.id)) &&
            !deletedIds.includes(String(c.customerCode)) &&
            !deletedIds.includes(String(c.name))
          );
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
      await addDoc(collection(db, 'notifications'), {
        ...notifObj,
        createdAt: serverTimestamp()
      });
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

      setTasks(prev => [autoTask, ...prev]);
      try { createTaskBackend(autoTask); } catch (_) { }
    } catch (e) { }
  };

  // CRUD Actions with Canonical Staff Identification
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
      createdAt: new Date().toISOString()
    };

    // 1. Write to Firestore first — onSnapshot will push update to all devices
    try {
      await setDoc(doc(db, 'customers', id), newCust, { merge: true });
    } catch (e) {
      console.warn('Firestore addCustomer error:', e);
      // Fallback: update local state only if Firestore write fails
      setCustomers(prev => [newCust, ...prev]);
    }

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
    const deletedIds = getDeletedCustomerIds();
    const targetCust = rawCustomers.find(c => String(c.id) === String(id) || String(c.customerCode) === String(id) || String(c.name) === String(id));
    const idsToBlacklist = [String(id)];
    if (targetCust) {
      if (targetCust.id) idsToBlacklist.push(String(targetCust.id));
      if (targetCust.customerCode) idsToBlacklist.push(String(targetCust.customerCode));
      if (targetCust.name) idsToBlacklist.push(String(targetCust.name));
    }

    const updatedDeleted = Array.from(new Set([...deletedIds, ...idsToBlacklist]));
    localStorage.setItem('crm_v2_deleted_customer_ids', JSON.stringify(updatedDeleted));

    // Remove from local state immediately
    setCustomers(prev => prev.filter(c =>
      !updatedDeleted.includes(String(c.id)) &&
      !updatedDeleted.includes(String(c.customerCode)) &&
      !updatedDeleted.includes(String(c.name))
    ));

    // Delete from Firestore directly — onSnapshot propagates deletion to all devices
    try {
      // Delete by known doc ID variants
      for (const delId of idsToBlacklist) {
        try { await deleteDoc(doc(db, 'customers', delId)); } catch (_) {}
      }
    } catch (e) {
      console.warn('Firestore deleteCustomer error:', e);
    }

    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_CLIENT',
      module: 'Customers',
      affectedRecord: String(id),
      details: 'Permanently deleted customer record'
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
      startDate: polData.startDate || new Date().toISOString().split('T')[0]
    };

    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'policies', id), newPol, { merge: true });
    } catch (e) {
      console.warn('Firestore addPolicy error:', e);
      setPolicies(prev => [newPol, ...prev]);
    }

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
      try { await setDoc(doc(db, 'customers', String(linkedCust.id)), updatedCust, { merge: true }); } catch (_) {}
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
    setPolicies(prev => prev.filter(p => String(p.id) !== String(id) && String(p.policyNo) !== String(id)));
    try {
      const saved = localStorage.getItem('crm_v2_policies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localStorage.setItem('crm_v2_policies', JSON.stringify(parsed.filter(p => String(p.id) !== String(id) && String(p.policyNo) !== String(id))));
        }
      }
    } catch (e) { }
    try { await deleteDoc(doc(db, 'policies', String(id))); } catch (e) { }
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'DELETE_POLICY',
      module: 'Policies',
      affectedRecord: String(id),
      details: `Deleted policy record ${id}`
    });
  };

  const clearAllPolicies = async () => {
    setPolicies([]);
    try {
      localStorage.setItem('crm_v2_policies', JSON.stringify([]));
    } catch (e) { }
    addAuditLog({
      userName: user?.name || 'Admin User',
      userRole: user?.role || 'ADMIN',
      action: 'CLEAR_ALL_POLICIES',
      module: 'Policies',
      affectedRecord: 'All Policies',
      details: 'Cleared all insurance policies register data'
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

    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'investments', id), newInv, { merge: true });
    } catch (e) {
      console.warn('Firestore addInvestment error:', e);
      setInvestments(prev => [newInv, ...prev]);
    }
    return newInv;
  };

  const updateInvestmentStatus = async (id, newStatus) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    try { await setDoc(doc(db, 'investments', id), { status: newStatus }, { merge: true }); } catch (e) { }
  };

  const deleteInvestment = async (id) => {
    if (!id) return;
    setInvestments(prev => prev.filter(i => String(i.id) !== String(id)));
    try {
      const saved = localStorage.getItem('crm_v2_investments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localStorage.setItem('crm_v2_investments', JSON.stringify(parsed.filter(i => String(i.id) !== String(id))));
        }
      }
    } catch (e) { }
    try { await deleteDoc(doc(db, 'investments', String(id))); } catch (e) { }
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

    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'leads', id), newLead, { merge: true });
    } catch (e) {
      console.warn('Firestore addLead error:', e);
      setLeads(prev => [newLead, ...prev]);
    }
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

    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'followups', id), newFlw, { merge: true });
    } catch (e) {
      console.warn('Firestore addFollowup error:', e);
      setFollowups(prev => [newFlw, ...prev]);
    }
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

    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'tasks', id), newTask, { merge: true });
    } catch (e) {
      console.warn('Firestore addTask error:', e);
      setTasks(prev => [newTask, ...prev]);
    }
    return newTask;
  };

  const updateTaskStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try { await setDoc(doc(db, 'tasks', id), { status: newStatus }, { merge: true }); } catch (e) { }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const saved = localStorage.getItem('crm_v2_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localStorage.setItem('crm_v2_tasks', JSON.stringify(parsed.filter(t => t.id !== id)));
        }
      }
    } catch (e) { }
    try {
      await deleteDoc(doc(db, 'tasks', String(id)));
    } catch (e) { }
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
    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'income', id), newInc, { merge: true });
    } catch (e) {
      console.warn('Firestore addIncome error:', e);
      setIncome(prev => [newInc, ...prev]);
    }
    return newInc;
  };

  const addExpense = async (expData) => {
    const id = expData.id || `EXP-SK-${Date.now()}`;
    const newExp = { ...expData, id, date: expData.date || new Date().toISOString().split('T')[0] };
    // Write to Firestore first — onSnapshot propagates to all devices
    try {
      await setDoc(doc(db, 'expenses', id), newExp, { merge: true });
    } catch (e) {
      console.warn('Firestore addExpense error:', e);
      setExpenses(prev => [newExp, ...prev]);
    }
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
    const userTasks = rawTasks.filter(matchingRecord);
    const userLeads = rawLeads.filter(matchingRecord);

    // Pull LocalStorage Customer Follow-up Progression Hubs & Spreadsheet Records for complete Customer 360 Linking
    let localHubs = [];
    let localSpreadsheet = [];
    try {
      localHubs = JSON.parse(localStorage.getItem('crm_v2_client_followup_hubs') || '[]');
      localSpreadsheet = JSON.parse(localStorage.getItem('crm_v2_spreadsheet_followups') || '[]');
    } catch (e) { }

    const matchingHubs = localHubs.filter(h =>
      matchingName(h.clientName) ||
      (h.clientId && effectiveCode && h.clientId.toLowerCase().trim() === effectiveCode.toLowerCase().trim()) ||
      (h.phone && masterCustomer?.phone && masterCustomer.phone.length > 5 && h.phone.replace(/\D/g, '').endsWith(masterCustomer.phone.replace(/\D/g, '').slice(-10)))
    );

    const matchingSpreadsheet = localSpreadsheet.filter(s =>
      matchingName(s.clientName) ||
      (s.phone && masterCustomer?.phone && masterCustomer.phone.length > 5 && s.phone.replace(/\D/g, '').endsWith(masterCustomer.phone.replace(/\D/g, '').slice(-10)))
    );

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
