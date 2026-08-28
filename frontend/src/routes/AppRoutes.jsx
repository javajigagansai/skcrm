import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Login } from '../pages/Login';

// Resilient Lazy Import helper to handle production chunk deployment hash updates
const lazyRetry = (componentImport) => {
  return lazy(async () => {
    const pageAlreadyRefreshed = JSON.parse(
      window.sessionStorage.getItem('page_refreshed_for_chunk_error') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page_refreshed_for_chunk_error', 'false');
      return component;
    } catch (error) {
      if (!pageAlreadyRefreshed) {
        window.sessionStorage.setItem('page_refreshed_for_chunk_error', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
};

// Dynamic Lazy Imports with Deployment Auto-Recovery
const Dashboard = lazyRetry(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Customers = lazyRetry(() => import('../pages/Customers').then(m => ({ default: m.Customers })));
const Policies = lazyRetry(() => import('../pages/Policies').then(m => ({ default: m.Policies })));
const Investments = lazyRetry(() => import('../pages/Investments').then(m => ({ default: m.Investments })));
const Claims = lazyRetry(() => import('../pages/Claims').then(m => ({ default: m.Claims })));
const Renewals = lazyRetry(() => import('../pages/Renewals').then(m => ({ default: m.Renewals })));
const Followups = lazyRetry(() => import('../pages/Followups').then(m => ({ default: m.Followups })));
const Income = lazyRetry(() => import('../pages/Income').then(m => ({ default: m.Income })));
const Expenses = lazyRetry(() => import('../pages/Expenses').then(m => ({ default: m.Expenses })));
const Tasks = lazyRetry(() => import('../pages/Tasks').then(m => ({ default: m.Tasks })));
const Reports = lazyRetry(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const Users = lazyRetry(() => import('../pages/Users').then(m => ({ default: m.Users })));
const StaffManagement = lazyRetry(() => import('../pages/StaffManagement').then(m => ({ default: m.StaffManagement })));
const AuditLogs = lazyRetry(() => import('../pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const SpecialDays = lazyRetry(() => import('../pages/SpecialDays').then(m => ({ default: m.SpecialDays })));
const Profile = lazyRetry(() => import('../pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazyRetry(() => import('../pages/Settings').then(m => ({ default: m.Settings })));
const Register = lazyRetry(() => import('../pages/Register').then(m => ({ default: m.Register })));

import { GeofenceGuard } from '../components/security/GeofenceGuard';

const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Loading Desk...</span>
    </div>
  </div>
);

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <GeofenceGuard>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </MainLayout>
    </GeofenceGuard>
  );
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes = () => {
  const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];
  const SPECIAL_DAYS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];
  const WORKER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];
  const MID_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
  const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Dashboard /></RoleProtectedRoute>} />
      <Route path="/special-days" element={<RoleProtectedRoute allowedRoles={SPECIAL_DAYS_ROLES}><SpecialDays /></RoleProtectedRoute>} />
      <Route path="/followups" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Followups /></RoleProtectedRoute>} />
      <Route path="/customers" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Customers /></RoleProtectedRoute>} />
      <Route path="/policies" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Policies /></RoleProtectedRoute>} />
      <Route path="/investments" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Investments /></RoleProtectedRoute>} />
      <Route path="/claims" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Claims /></RoleProtectedRoute>} />
      <Route path="/renewals" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Renewals /></RoleProtectedRoute>} />
      <Route path="/income" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><Income /></RoleProtectedRoute>} />
      <Route path="/expenses" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><Expenses /></RoleProtectedRoute>} />
      <Route path="/tasks" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><Tasks /></RoleProtectedRoute>} />
      <Route path="/reports" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><Reports /></RoleProtectedRoute>} />
      <Route path="/users" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><Users /></RoleProtectedRoute>} />
      <Route path="/staff" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><StaffManagement /></RoleProtectedRoute>} />
      <Route path="/staff-management" element={<RoleProtectedRoute allowedRoles={WORKER_ROLES}><StaffManagement /></RoleProtectedRoute>} />
      <Route path="/audit-logs" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><AuditLogs /></RoleProtectedRoute>} />
      <Route path="/profile" element={<RoleProtectedRoute allowedRoles={MID_MANAGEMENT_ROLES}><Profile /></RoleProtectedRoute>} />
      <Route path="/settings" element={<RoleProtectedRoute allowedRoles={ADMIN_ROLES}><Settings /></RoleProtectedRoute>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

