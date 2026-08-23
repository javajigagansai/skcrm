import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  ShieldCheck, Clock, User, FileText, Search, Filter, Plus, Download, 
  Sparkles, CheckCircle2, Lock, X, Activity, UserCheck, Calendar
} from 'lucide-react';

const DEFAULT_AUDIT_LOGS = [
  { id: 'LOG-1001', userName: 'Prakash Gajendiran', userRole: 'SUPER_ADMIN', action: 'USER_LOGIN', module: 'Auth', affectedRecord: 'Session', timestamp: new Date().toLocaleString('en-IN'), details: 'Super Admin logged in successfully' },
  { id: 'LOG-1002', userName: 'Priya Sharma', userRole: 'EMPLOYEE', action: 'CREATE_CLIENT', module: 'Customers', affectedRecord: 'Rahul Sharma (SK-CUST-101)', timestamp: new Date(Date.now() - 3600000).toLocaleString('en-IN'), details: 'New customer profile registered' },
  { id: 'LOG-1003', userName: 'Branch Manager', userRole: 'MANAGER', action: 'FILE_CLAIM', module: 'Claims', affectedRecord: 'CLM-2026-001 (Rahul Sharma)', timestamp: new Date(Date.now() - 7200000).toLocaleString('en-IN'), details: 'Health insurance claim submitted for ₹1,50,000' },
  { id: 'LOG-1004', userName: 'Priya Sharma', userRole: 'EMPLOYEE', action: 'UPDATE_FOLLOWUP', module: 'Followups', affectedRecord: 'Priya Menon', timestamp: new Date(Date.now() - 10800000).toLocaleString('en-IN'), details: 'Scheduled callback for quotation review' },
  { id: 'LOG-1005', userName: 'Prakash Gajendiran', userRole: 'SUPER_ADMIN', action: 'STAFF_REASSIGNMENT', module: 'Staff Portal', affectedRecord: 'Anand Kumar', timestamp: new Date(Date.now() - 14400000).toLocaleString('en-IN'), details: 'Reassigned 5 client portfolios to Priya Sharma' }
];

export const AuditLogs = () => {
  const { user } = useAuth();
  const { auditLogs, addAuditLog } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newLogForm, setNewLogForm] = useState({
    action: 'SECURITY_AUDIT',
    module: 'Auth',
    affectedRecord: 'System Settings',
    details: 'Completed quarterly security audit and access review.'
  });

  const logsList = Array.isArray(auditLogs) && auditLogs.length > 0 ? auditLogs : DEFAULT_AUDIT_LOGS;

  const filteredLogs = logsList.filter(log => {
    if (!log) return false;
    const action = log.action || '';
    const userName = log.userName || '';
    const affected = log.affectedRecord || '';
    const details = log.details || '';
    const module = log.module || '';

    const matchesSearch = 
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affected.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedModule !== 'ALL' && module !== selectedModule) return false;

    if (filterStartDate || filterEndDate) {
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      if (logDate && !isNaN(logDate.getTime())) {
        if (filterStartDate && logDate < new Date(filterStartDate + 'T00:00:00')) return false;
        if (filterEndDate && logDate > new Date(filterEndDate + 'T23:59:59')) return false;
      }
    }

    return true;
  });

  const handleAddLogSubmit = (e) => {
    e.preventDefault();
    if (!newLogForm.details.trim()) return;

    addAuditLog({
      userName: user?.name || 'Prakash Gajendiran',
      userRole: user?.role || 'SUPER_ADMIN',
      action: newLogForm.action,
      module: newLogForm.module,
      affectedRecord: newLogForm.affectedRecord,
      details: newLogForm.details,
      timestamp: new Date().toLocaleString('en-IN')
    });

    setShowAddModal(false);
    setNewLogForm({
      action: 'SECURITY_AUDIT',
      module: 'Auth',
      affectedRecord: 'System Settings',
      details: 'Completed quarterly security audit and access review.'
    });
    alert('Security Audit Log recorded successfully!');
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit logs available to export!');
      return;
    }

    const headers = ['Log ID', 'Action', 'Module', 'User Name', 'User Role', 'Affected Record', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(l => [
      l.id || '',
      l.action || '',
      l.module || '',
      l.userName || '',
      l.userRole || '',
      `"${(l.affectedRecord || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.timestamp || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SK_Smart_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            <span>Security &amp; Activity Audit Desk</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Real-time security audit log tracking user logins, client CRUD, claim filings, staff assignments &amp; role permissions.</p>
        </div>

        <div className="flex items-center space-x-3">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Audit Logs (CSV)</span>
            </button>
          )}

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Security Log</span>
          </button>
        </div>
      </div>

      {/* Audit Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total Audit Records</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{logsList.length}</p>
          <span className="badge badge-blue text-[10px] mt-1">Live Log Entries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Auth &amp; Login Events</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{logsList.filter(l => l?.module === 'Auth').length}</p>
          <span className="badge badge-brand text-[10px] mt-1">Session Logs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Client CRUD Actions</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{logsList.filter(l => l?.module === 'Customers' || l?.module === 'Policies').length}</p>
          <span className="badge badge-green text-[10px] mt-1">Master Mutations</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Claims &amp; Ops Logs</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{logsList.filter(l => l?.module === 'Claims' || l?.module === 'Staff Portal').length}</p>
          <span className="badge badge-purple text-[10px] mt-1">Operations Desk</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search logs by action, user, client or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Modules ({logsList.length})</option>
              <option value="Auth">Auth &amp; Login</option>
              <option value="Customers">Customers</option>
              <option value="Policies">Policies</option>
              <option value="Claims">Claims</option>
              <option value="Followups">Followups</option>
              <option value="Staff Portal">Staff Portal</option>
            </select>
          </div>

          {/* Date Range Custom Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1 text-slate-600 font-bold text-xs shrink-0">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Date:</span>
            </div>
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dd-mm-yyyy"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dd-mm-yyyy"
            />
            <button
              type="button"
              onClick={() => {}}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center"
            >
              Filter
            </button>
            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                <th className="p-4">Action &amp; Module</th>
                <th className="p-4">User / Staff Member</th>
                <th className="p-4">Affected Record</th>
                <th className="p-4">Activity Details</th>
                <th className="p-4">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id || Math.random()} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <span className={`badge ${
                      log.action?.includes('CREATE') ? 'badge-green' : 
                      log.action?.includes('CLAIM') ? 'badge-amber' : 
                      log.action?.includes('LOGIN') ? 'badge-blue' : 'badge-purple'
                    }`}>
                      {log.action || 'MUTATION'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-1">Module: {log.module || 'General'}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-extrabold text-slate-900 flex items-center space-x-1">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      <span>{log.userName || 'System User'}</span>
                    </p>
                    <p className="text-[11px] text-purple-700 font-bold">Role: {log.userRole || 'STAFF'}</p>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">{log.affectedRecord || '-'}</td>
                  <td className="p-4 font-medium text-slate-600">{log.details || 'Action completed'}</td>
                  <td className="p-4 font-mono text-slate-500">{log.timestamp}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-xs text-slate-400 font-semibold">
                    No matching audit log records found for "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Manual Security Log */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>Record Security Audit Log</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddLogSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Audit Action Type</label>
                <input 
                  type="text"
                  required
                  value={newLogForm.action}
                  onChange={(e) => setNewLogForm({ ...newLogForm, action: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  placeholder="e.g. SECURITY_AUDIT, PERMISSION_UPDATE"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Module Category</label>
                <select 
                  value={newLogForm.module}
                  onChange={(e) => setNewLogForm({ ...newLogForm, module: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white"
                >
                  <option value="Auth">Auth &amp; Login</option>
                  <option value="Customers">Customers</option>
                  <option value="Policies">Policies</option>
                  <option value="Claims">Claims</option>
                  <option value="Staff Portal">Staff Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Affected Record / Target</label>
                <input 
                  type="text"
                  required
                  value={newLogForm.affectedRecord}
                  onChange={(e) => setNewLogForm({ ...newLogForm, affectedRecord: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  placeholder="e.g. System Settings, Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Audit Details &amp; Notes</label>
                <textarea 
                  required
                  rows="3"
                  value={newLogForm.details}
                  onChange={(e) => setNewLogForm({ ...newLogForm, details: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  placeholder="Describe the audit action or verification event..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition shadow-md"
                >
                  Save Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
