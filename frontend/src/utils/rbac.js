/**
 * Centralized Role-Based Access Control (RBAC) & Record Scoping Engine
 * SK Smart Investments CRM v2
 */

// Master Role Constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  STAFF: 'STAFF',
  STAFF_ADVISOR: 'STAFF_ADVISOR',
  USER: 'USER'
};

/**
 * Normalizes role string for comparison
 */
export const normalizeRole = (role) => {
  if (!role) return ROLES.EMPLOYEE;
  const upper = String(role).toUpperCase().trim();
  if (upper === 'SUPERADMIN' || upper === 'SUPER_ADMIN' || upper === 'ADMIN') return ROLES.SUPER_ADMIN;
  if (upper === 'MANAGER' || upper === 'BRANCH_MANAGER' || upper === 'BRANCH MANAGER') return ROLES.MANAGER;
  return ROLES.EMPLOYEE;
};

/**
 * Check if active user is Super Admin or Admin
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  const r = normalizeRole(user.role);
  return r === ROLES.SUPER_ADMIN;
};

/**
 * Check if active user is Branch / Regional Manager
 */
export const isManager = (user) => {
  if (!user) return false;
  const r = normalizeRole(user.role);
  return r === ROLES.MANAGER;
};

/**
 * Check if active user is Staff Advisor / Employee
 */
export const isStaffAdvisor = (user) => {
  if (!user) return false;
  return !isSuperAdmin(user) && !isManager(user);
};

/**
 * Obtain canonical staff identifier from user object
 */
export const getCanonicalStaffUid = (user) => {
  if (!user) return '';
  return user.uid || user.id || '';
};

/**
 * Obtain staff email normalized
 */
export const getCanonicalStaffEmail = (user) => {
  if (!user) return '';
  return (user.email || '').toLowerCase().trim();
};

/**
 * Helper to match staff identity against record fields
 */
export const isRecordOwnedByUser = (user, record) => {
  if (!user || !record) return false;

  // Super Admin can see all records
  if (isSuperAdmin(user)) return true;

  const activeUid = getCanonicalStaffUid(user);
  const activeEmail = getCanonicalStaffEmail(user);
  const activeName = (user.name || '').toLowerCase().trim();
  const activeFirst = activeName.split(' ')[0];

  // Record ownership fields
  const recStaffId = record.assignedStaffId || record.staffId || record.assignedUserId || '';
  const recStaffEmail = (record.assignedStaffEmail || record.advisorEmail || record.staffEmail || '').toLowerCase().trim();
  const recStaffName = (record.assignedStaff || record.assignedAdvisorName || record.assignedToName || record.advisorName || record.assignedTo || record.staffName || '').toLowerCase().trim();
  const recBranchId = record.branchId || record.branch || '';

  // Branch Manager Scope
  if (isManager(user)) {
    const userBranch = user.branchId || user.branch || '';
    if (userBranch && recBranchId && (userBranch.toLowerCase() === recBranchId.toLowerCase() || recBranchId.toLowerCase().includes(userBranch.toLowerCase()))) {
      return true;
    }
    // Also match manager's own direct assignments
  }

  // Exact Canonical UID Match (Primary Security Mechanism)
  if (activeUid && recStaffId && activeUid === recStaffId) return true;

  // Exact Email Match
  if (activeEmail && recStaffEmail && activeEmail === recStaffEmail) return true;

  // Staff Name String Match (Secondary Fallback during legacy migration)
  if (recStaffName && activeName && (recStaffName === activeName || (activeFirst.length > 2 && recStaffName.split(' ')[0] === activeFirst))) return true;

  return false;
};

/**
 * Filter an array of records according to active user's authorized scope
 */
export const filterScopedRecords = (user, records) => {
  if (!Array.isArray(records)) return [];
  if (!user) return [];

  // Super Admin receives unrestricted dataset
  if (isSuperAdmin(user)) return records;

  return records.filter(rec => isRecordOwnedByUser(user, rec));
};

/**
 * Authorization checks for specific resource types
 */
export const canAccessCustomer = (user, customer) => isRecordOwnedByUser(user, customer);
export const canAccessPolicy = (user, policy) => isRecordOwnedByUser(user, policy);
export const canAccessLead = (user, lead) => isRecordOwnedByUser(user, lead);
export const canAccessInvestment = (user, investment) => isRecordOwnedByUser(user, investment);
export const canAccessClaim = (user, claim) => isRecordOwnedByUser(user, claim);
export const canAccessRenewal = (user, renewal) => isRecordOwnedByUser(user, renewal);
export const canAccessTask = (user, task) => isRecordOwnedByUser(user, task);
