import { auth, db } from '../config/firebaseClient';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Fallback direct Firestore handler when Spring Boot API is offline/unreachable
const firestoreFallbackHandler = async (endpoint, options) => {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // Extract collection name and document ID from endpoint
  // Examples: /api/customers -> collection 'customers', id null
  //           /api/customers/CUST-101 -> collection 'customers', id 'CUST-101'
  const match = endpoint.match(/^\/api\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/);

  if (match) {
    const colName = match[1];
    const docId = match[2] || body.id;

    if (colName && colName !== 'reports') {
      if (method === 'GET') {
        if (docId) {
          const snap = await getDoc(doc(db, colName, docId));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        } else {
          const snap = await getDocs(collection(db, colName));
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        const id = docId || `${colName.toUpperCase().slice(0, 3)}-${Date.now()}`;
        const docData = { ...body, id, updatedAt: new Date().toISOString() };
        if (colName === 'customers') docData.customerCode = id;
        await setDoc(doc(db, colName, id), docData, { merge: true });
        return docData;
      } else if (method === 'DELETE') {
        const id = docId || body.id;
        if (id) {
          try {
            await deleteDoc(doc(db, colName, String(id)));
          } catch (e) {}

          // Also scan collection and delete any doc matching id, customerCode, or name
          try {
            const querySnap = await getDocs(collection(db, colName));
            querySnap.docs.forEach(async (d) => {
              const data = d.data();
              if (
                d.id === String(id) || 
                String(data.id) === String(id) || 
                String(data.customerCode) === String(id) || 
                String(data.name) === String(id)
              ) {
                try { await deleteDoc(doc(db, colName, d.id)); } catch (e) {}
              }
            });
          } catch (e) {}
        }
        return { message: `${colName} item deleted`, id };
      }
    }
  }

  if (endpoint.startsWith('/api/reports/summary')) {
    const custSnap = await getDocs(collection(db, 'customers'));
    const invSnap = await getDocs(collection(db, 'investments'));
    const leadsSnap = await getDocs(collection(db, 'leads'));
    const incSnap = await getDocs(collection(db, 'income'));
    const expSnap = await getDocs(collection(db, 'expenses'));

    let totalVol = 0;
    invSnap.docs.forEach(d => { totalVol += Number(d.data().amount || 0); });

    let totalInc = 0;
    incSnap.docs.forEach(d => { totalInc += Number(d.data().amount || 0); });

    let totalExp = 0;
    expSnap.docs.forEach(d => { totalExp += Number(d.data().amount || 0); });

    return {
      period: 'MONTHLY',
      totalCustomers: custSnap.size,
      totalActiveLeads: leadsSnap.size,
      totalInvestmentsCount: invSnap.size,
      totalInvestmentVolume: totalVol,
      totalIncomeVolume: totalInc,
      totalExpenseVolume: totalExp,
      netProfit: totalInc - totalExp,
      pendingTasksCount: 0
    };
  }

  if (endpoint.startsWith('/api/admin/policy-categories-overview') || endpoint.startsWith('/admin/policy-categories-overview')) {
    const savedUser = sessionStorage.getItem('crm_v2_active_user') || localStorage.getItem('crm_v2_active_user');
    let userRole = 'USER';
    if (savedUser) {
      try { userRole = JSON.parse(savedUser)?.role || 'USER'; } catch (e) {}
    }
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: Only Admins can view Policy Category Overview');
    }

    const polSnap = await getDocs(collection(db, 'policies'));
    const categoryCounts = {};
    const companyBreakdown = {};

    polSnap.docs.forEach(d => {
      const p = d.data();
      const cat = p.category || p.type || 'General Insurance';
      const comp = p.insuranceCompany || p.company || 'General Provider';

      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (!companyBreakdown[comp]) companyBreakdown[comp] = {};
      companyBreakdown[comp][cat] = (companyBreakdown[comp][cat] || 0) + 1;
    });

    return {
      title: 'Policy Category Overview',
      totalPolicies: polSnap.size,
      categoryCounts,
      companyBreakdown
    };
  }

  return method === 'GET' ? [] : body;
};

let isBackendOfflineCached = true;
let lastBackendCheckTime = 0;
const BACKEND_OFFLINE_CACHE_MS = 300000; // 5 minutes circuit breaker

export const apiCall = async (endpoint, options = {}) => {
  const now = Date.now();
  // Circuit breaker: skip network fetch and execute Firestore/local fallback instantly (0ms)
  if (isBackendOfflineCached && (now - lastBackendCheckTime < BACKEND_OFFLINE_CACHE_MS)) {
    return await firestoreFallbackHandler(endpoint, options);
  }

  let token = null;
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn("Failed to retrieve Firebase ID token:", err);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms fast timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    isBackendOfflineCached = false; // Backend is healthy
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    isBackendOfflineCached = true;
    lastBackendCheckTime = Date.now();
    console.warn(`Spring Boot API unreachable (${endpoint}). Fast falling back to Cloud Firestore / local persistence:`, err.message);
    return await firestoreFallbackHandler(endpoint, options);
  }
};

// Auth & Users
export const registerUserBackend = (uid, name, email, role) => 
  apiCall('/users/register', {
    method: 'POST',
    body: JSON.stringify({ uid, name, email, role })
  });

export const assignUserRoleBackend = (uid, role) =>
  apiCall('/admin/role', {
    method: 'POST',
    body: JSON.stringify({ uid, role })
  });

export const checkFirstLoginBackend = () =>
  apiCall('/auth/first-login-check', {
    method: 'POST'
  });

export const getCurrentUserBackend = () =>
  apiCall('/auth/me');

export const fetchAllUsersBackend = () =>
  apiCall('/admin/users');

export const updateUserStatusBackend = (uid, status) =>
  apiCall(`/admin/users/${uid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

// Leads
export const fetchLeadsBackend = () => apiCall('/api/leads');
export const createLeadBackend = (leadData) => apiCall('/api/leads', { method: 'POST', body: JSON.stringify(leadData) });
export const updateLeadBackend = (id, leadData) => apiCall(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(leadData) });
export const updateLeadStatusBackend = (id, status) => apiCall(`/api/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteLeadBackend = (id) => apiCall(`/api/leads/${id}`, { method: 'DELETE' });
export const convertLeadToCustomerBackend = (id) => apiCall(`/api/leads/${id}/convert`, { method: 'POST' });

// Customers
export const fetchCustomersBackend = () => apiCall('/api/customers');
export const createCustomerBackend = (custData) => apiCall('/api/customers', { method: 'POST', body: JSON.stringify(custData) });
export const updateCustomerBackend = (id, custData) => apiCall(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(custData) });
export const deleteCustomerBackend = (id) => apiCall(`/api/customers/${id}`, { method: 'DELETE' });

// Investments
export const fetchInvestmentsBackend = () => apiCall('/api/investments');
export const createInvestmentBackend = (invData) => apiCall('/api/investments', { method: 'POST', body: JSON.stringify(invData) });
export const approveInvestmentBackend = (id) => apiCall(`/api/investments/${id}/approve`, { method: 'POST' });
export const updateInvestmentStatusBackend = (id, status) => apiCall(`/api/investments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Financials (Income & Expenses)
export const fetchIncomeBackend = () => apiCall('/api/income');
export const createIncomeBackend = (data) => apiCall('/api/income', { method: 'POST', body: JSON.stringify(data) });
export const fetchExpensesBackend = () => apiCall('/api/expenses');
export const createExpenseBackend = (data) => apiCall('/api/expenses', { method: 'POST', body: JSON.stringify(data) });

// Tasks & Audit Logs
export const fetchTasksBackend = () => apiCall('/api/tasks');
export const createTaskBackend = (data) => apiCall('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTaskStatusBackend = (id, status) => apiCall(`/api/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const fetchAuditLogsBackend = () => apiCall('/admin/audit-logs');
export const fetchReportsSummaryBackend = (period = 'MONTHLY') => apiCall(`/api/reports/summary?period=${period}`);
export const fetchPolicyCategoriesOverviewBackend = () => apiCall('/api/admin/policy-categories-overview');
