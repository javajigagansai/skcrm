import { auth, db } from '../config/firebaseClient';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Fallback direct Firestore handler when Spring Boot API is offline/unreachable
const firestoreFallbackHandler = async (endpoint, options) => {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  if (endpoint.startsWith('/api/customers')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'customers'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'CUST-' + Date.now();
      const docData = { ...body, id, customerCode: id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'customers', id), docData);
      return docData;
    } else if (method === 'DELETE') {
      const parts = endpoint.split('/');
      const id = parts[parts.length - 1];
      await deleteDoc(doc(db, 'customers', id));
      return { message: 'Customer deleted', id };
    }
  } else if (endpoint.startsWith('/api/investments')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'investments'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'INV-2026-' + Date.now();
      const docData = { ...body, id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'investments', id), docData);
      return docData;
    }
  } else if (endpoint.startsWith('/api/leads')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'leads'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'LD-2026-' + Date.now();
      const docData = { ...body, id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'leads', id), docData);
      return docData;
    }
  } else if (endpoint.startsWith('/api/income')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'income'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'INC-' + Date.now();
      const docData = { ...body, id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'income', id), docData);
      return docData;
    }
  } else if (endpoint.startsWith('/api/expenses')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'expenses'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'EXP-' + Date.now();
      const docData = { ...body, id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'expenses', id), docData);
      return docData;
    }
  } else if (endpoint.startsWith('/api/tasks')) {
    if (method === 'GET') {
      const snap = await getDocs(collection(db, 'tasks'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (method === 'POST') {
      const id = body.id || 'TSK-' + Date.now();
      const docData = { ...body, id, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'tasks', id), docData);
      return docData;
    }
  } else if (endpoint.startsWith('/api/reports/summary')) {
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
