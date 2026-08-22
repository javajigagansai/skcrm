import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportClaimsExcel } from '../utils/exportUtils';
import { Plus, Search, ShieldCheck, CheckCircle2, Clock, AlertCircle, X, UserCheck, Sparkles, Filter, RotateCcw, FileSpreadsheet, Download } from 'lucide-react';

export const Claims = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { claims, addClaim, updateClaimStatus } = useData();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterAmountRange, setFilterAmountRange] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterCompany('ALL');
    setFilterAmountRange('ALL');
  };

  const [newClaim, setNewClaim] = useState({
    policyNo: '',
    customerName: '',
    insuranceCompany: '',
    claimAmount: '',
    hospitalOrGarage: '',
    assignedStaff: user?.name || 'Priya Sharma'
  });

  const handleFileClaim = (e) => {
    e.preventDefault();
    if (!newClaim.customerName || !newClaim.policyNo) {
      alert("Please fill in Customer Name and Policy Number");
      return;
    }
    const created = addClaim({
      ...newClaim,
      claimAmount: parseFloat(newClaim.claimAmount || 0),
      assignedStaff: newClaim.assignedStaff || user?.name || 'Priya Sharma'
    });
    setShowAddModal(false);
    setNewClaim({ policyNo: '', customerName: '', insuranceCompany: '', claimAmount: '', hospitalOrGarage: '', assignedStaff: user?.name || '' });
    alert(`Claim ${created.id} submitted successfully!`);
  };

  const handleUpdateClaimStatus = (id, newStatus) => {
    updateClaimStatus(id, newStatus);
  };

  const filtered = useMemo(() => {
    return (claims || []).filter(c => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (c.id || '').toLowerCase().includes(term) ||
        (c.customerName || '').toLowerCase().includes(term) ||
        (c.policyNo || '').toLowerCase().includes(term) ||
        (c.insuranceCompany || '').toLowerCase().includes(term) ||
        (c.claimType || c.category || '').toLowerCase().includes(term) ||
        (c.hospitalOrGarage || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterStatus !== 'ALL') {
        const st = (c.status || 'UNDER_REVIEW').toUpperCase();
        if (filterStatus === 'UNDER_REVIEW' && st !== 'UNDER_REVIEW' && st !== 'PENDING') return false;
        if (filterStatus === 'APPROVED' && st !== 'APPROVED' && st !== 'SETTLED') return false;
        if (filterStatus === 'SETTLED' && st !== 'SETTLED' && st !== 'PAID') return false;
        if (filterStatus === 'REJECTED' && st !== 'REJECTED') return false;
      }

      if (filterCompany !== 'ALL') {
        const companyName = (c.insuranceCompany || '').toLowerCase();
        if (!companyName.includes(filterCompany.toLowerCase())) return false;
      }

      if (filterAmountRange !== 'ALL') {
        const amt = Number(c.claimAmount || 0);
        if (filterAmountRange === 'BELOW_50K' && amt >= 50000) return false;
        if (filterAmountRange === '50K_2L' && (amt < 50000 || amt > 200000)) return false;
        if (filterAmountRange === 'ABOVE_2L' && amt <= 200000) return false;
      }

      return true;
    });
  }, [claims, searchTerm, filterStatus, filterCompany, filterAmountRange]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterCompany !== 'ALL' ? 1 : 0) +
    (filterAmountRange !== 'ALL' ? 1 : 0);

  // Extract unique insurer names from claims
  const uniqueInsurers = useMemo(() => {
    const set = new Set();
    (claims || []).forEach(c => {
      if (c.insuranceCompany) set.add(c.insuranceCompany);
    });
    return Array.from(set);
  }, [claims]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Claims Assistance Desk</h1>
          <p className="text-xs text-slate-500 font-semibold">Track cashless hospitalization &amp; reimbursement claim settlements.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button 
                onClick={() => exportFollowupsPDF(filtered)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button 
                onClick={() => exportClaimsExcel(filtered)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>File New Claim</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Claims Filed</span>
          <p className="text-2xl font-black text-slate-900">{claims.length}</p>
          <span className="badge badge-brand text-[10px]">Active Tracked Claims</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Claims Settlement Ratio</span>
          <p className="text-2xl font-black text-emerald-600">
            {claims.length > 0 ? `${((claims.filter(c => c.status === 'SETTLED' || c.status === 'APPROVED').length / claims.length) * 100).toFixed(1)}%` : '0%'}
          </p>
          <span className="badge badge-green text-[10px]">Fast-Track Approval</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Settled Value</span>
          <p className="text-2xl font-black text-slate-900">
            ₹ {claims.filter(c => c.status === 'SETTLED' || c.status === 'APPROVED').reduce((sum, c) => sum + Number(c.claimAmount || c.settlementAmount || 0), 0).toLocaleString()}
          </p>
          <span className="badge badge-purple text-[10px]">Disbursed to Clients</span>
        </div>
      </div>

      {/* CUSTOMER 360 STYLE ADVANCED MULTI-FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Customer 360° Claims Filters
            </h3>
            {activeFiltersCount > 0 && (
              <span className="badge badge-brand text-[10px] font-black px-2 py-0.5">
                {activeFiltersCount} Active {activeFiltersCount === 1 ? 'Filter' : 'Filters'}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Bar */}
          <div className="sm:col-span-2 relative">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Claim ID, Client, Policy No, Insurer, Hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Claim Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review / Submitted</option>
              <option value="APPROVED">Approved / In Process</option>
              <option value="SETTLED">Settled &amp; Disbursed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Claim Amount Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Claim Amount Range</label>
            <select
              value={filterAmountRange}
              onChange={(e) => setFilterAmountRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Claim Amounts</option>
              <option value="BELOW_50K">Below ₹50,000</option>
              <option value="50K_2L">₹50,000 - ₹2,00,000</option>
              <option value="ABOVE_2L">Above ₹2,00,000</option>
            </select>
          </div>

        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filtered.length}</strong> of <strong className="text-slate-900">{claims.length}</strong> total claim records</span>
          {filtered.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching claim files found.</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Claim ID &amp; Policy</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Insurer</th>
                <th className="p-4">Claim Amount</th>
                <th className="p-4">Assigned Staff / Officer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-extrabold text-slate-900">
                    <p>{c.id}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{c.policyNo}</p>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openCustomer360(c.customerName)}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile"
                    >
                      <span>{c.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                  </td>
                  <td className="p-4">{c.insuranceCompany}</td>
                  <td className="p-4 font-mono font-black text-slate-900">₹{c.claimAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-blue-600 shrink-0" />
                      <span>{c.assignedStaff || 'Karthik Subramanian (Claims Head)'}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${c.status === 'SETTLED' ? 'badge-green' : c.status === 'UNDER_PROCESS' ? 'badge-amber' : 'badge-brand'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select 
                      value={c.status} 
                      onChange={(e) => handleUpdateClaimStatus(c.id, e.target.value)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-200 bg-white"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_PROCESS">UNDER_PROCESS</option>
                      <option value="SETTLED">SETTLED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">File Insurance Claim Request</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input type="text" required placeholder="Enter Customer Name" value={newClaim.customerName} onChange={(e) => setNewClaim({...newClaim, customerName: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Number</label>
                  <input type="text" required value={newClaim.policyNo} onChange={(e) => setNewClaim({...newClaim, policyNo: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Amount (₹)</label>
                  <input type="number" required value={newClaim.claimAmount} onChange={(e) => setNewClaim({...newClaim, claimAmount: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Claims Officer</label>
                <select 
                  value={newClaim.assignedStaff} 
                  onChange={(e) => setNewClaim({...newClaim, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Karthik Subramanian (Claims Head)">Karthik Subramanian (Claims Head)</option>
                  <option value="Anitha S. (Claim Specialist)">Anitha S. (Claim Specialist)</option>
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow cursor-pointer">Submit Claim to Desk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
