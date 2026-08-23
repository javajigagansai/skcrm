import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportClaimsExcel } from '../utils/exportUtils';
import { Plus, Search, ShieldCheck, CheckCircle2, Clock, AlertCircle, X, UserCheck, Sparkles, Filter, RotateCcw, FileSpreadsheet, Download, Edit3, Trash2, User, Layers, Check } from 'lucide-react';

export const Claims = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { claims, addClaim, updateClaim, updateClaimStatus, deleteClaim, customers, policies, getCustomerAggregatedDetails } = useData();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterAmountRange, setFilterAmountRange] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);

  // Customer Autocomplete & Policy Linkage State (Strict Typing-Only & Click-Outside Dismissal)
  const custWrapperRef = useRef(null);
  const [showCustSuggest, setShowCustSuggest] = useState(false);
  const [availableCustomerPolicies, setAvailableCustomerPolicies] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (custWrapperRef.current && !custWrapperRef.current.contains(event.target)) {
        setShowCustSuggest(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    claimType: '',
    claimAmount: '',
    settlementAmount: '',
    hospitalOrGarage: '',
    assignedStaff: '',
    status: 'SUBMITTED'
  });

  const handleOpenAddModal = () => {
    setNewClaim({
      policyNo: '',
      customerName: '',
      insuranceCompany: '',
      claimType: '',
      claimAmount: '',
      settlementAmount: '',
      hospitalOrGarage: '',
      assignedStaff: '',
      status: 'SUBMITTED'
    });
    setAvailableCustomerPolicies([]);
    setShowCustSuggest(false);
    setShowAddModal(true);
  };

  const filteredCustomers = useMemo(() => {
    const term = (newClaim.customerName || '').trim().toLowerCase();
    if (!term) return [];
    return (customers || []).filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(term);
      const phoneMatch = (c.phone || c.mobileNumber || '').includes(term);
      const codeMatch = (c.customerCode || c.id || '').toLowerCase().includes(term);
      return nameMatch || phoneMatch || codeMatch;
    }).slice(0, 8);
  }, [customers, newClaim.customerName]);

  const handleSelectCustomer = (cust) => {
    const custId = cust.id || cust.customerCode;
    const custName = cust.name;
    const custCode = cust.customerCode || cust.id;

    let custPolicies = [];
    if (typeof getCustomerAggregatedDetails === 'function') {
      const agg = getCustomerAggregatedDetails(cust);
      if (agg && Array.isArray(agg.policiesList) && agg.policiesList.length > 0) {
        custPolicies = agg.policiesList;
      }
    }

    if (custPolicies.length === 0) {
      custPolicies = (policies || []).filter(p => {
        const matchesId = p.customerId && (p.customerId === custId || p.customerId === custCode);
        const matchesName = p.customerName && custName && p.customerName.toLowerCase().trim() === custName.toLowerCase().trim();
        return matchesId || matchesName;
      });
    }

    if (custPolicies.length === 0 && (cust.insuranceCompany || cust.policyNo)) {
      custPolicies = [{
        id: cust.policyNo || 'POL-REG-01',
        policyNo: cust.policyNo || 'POL-REG-01',
        insuranceCompany: cust.insuranceCompany || '',
        policyName: cust.salesPitch || cust.insuranceType || 'Active Policy',
        assignedStaff: cust.assignedAdvisorName || cust.assignedStaff || ''
      }];
    }

    setAvailableCustomerPolicies(custPolicies);

    if (custPolicies.length === 1) {
      const p = custPolicies[0];
      setNewClaim(prev => ({
        ...prev,
        customerId: custId,
        customerCode: custCode,
        customerName: cust.name,
        policyNo: p.id || p.policyNo || '',
        insuranceCompany: p.insuranceCompany || '',
        claimType: p.type || p.category ? `${p.type || p.category} Claim` : prev.claimType,
        assignedStaff: p.assignedStaff || cust.assignedAdvisorName || cust.assignedStaff || prev.assignedStaff
      }));
    } else {
      setNewClaim(prev => ({
        ...prev,
        customerId: custId,
        customerCode: custCode,
        customerName: cust.name,
        policyNo: '',
        insuranceCompany: '',
        assignedStaff: cust.assignedAdvisorName || cust.assignedStaff || prev.assignedStaff
      }));
    }

    setShowCustSuggest(false);
  };

  const handleSelectPolicy = (selectedPolicyId) => {
    if (!selectedPolicyId) {
      setNewClaim(prev => ({
        ...prev,
        policyNo: '',
        insuranceCompany: ''
      }));
      return;
    }
    const p = availableCustomerPolicies.find(pol => (pol.id || pol.policyNo) === selectedPolicyId);
    if (p) {
      setNewClaim(prev => ({
        ...prev,
        policyNo: p.id || p.policyNo || selectedPolicyId,
        insuranceCompany: p.insuranceCompany || prev.insuranceCompany,
        claimType: p.type || p.category ? `${p.type || p.category} Claim` : prev.claimType,
        assignedStaff: p.assignedStaff || prev.assignedStaff
      }));
    }
  };

  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!newClaim.customerName || !newClaim.policyNo) {
      alert("Please fill in Customer Name and Policy Number");
      return;
    }
    const matchedCust = (customers || []).find(c => c.name?.toLowerCase().trim() === newClaim.customerName.toLowerCase().trim());
    const created = await addClaim({
      ...newClaim,
      customerId: matchedCust?.id || matchedCust?.customerCode || newClaim.customerId || '',
      customerCode: matchedCust?.customerCode || matchedCust?.id || newClaim.customerCode || '',
      claimAmount: parseFloat(newClaim.claimAmount || 0),
      settlementAmount: parseFloat(newClaim.settlementAmount || 0),
      assignedStaff: newClaim.assignedStaff || user?.name || 'Priya Sharma'
    });
    setShowAddModal(false);
    setNewClaim({ policyNo: '', customerName: '', insuranceCompany: '', claimType: '', claimAmount: '', settlementAmount: '', hospitalOrGarage: '', assignedStaff: '', status: 'SUBMITTED' });
    setAvailableCustomerPolicies([]);
    alert(`Claim ${created.id} submitted successfully! Directly synced to Customer 360.`);
  };

  const handleOpenEdit = (clm) => {
    setEditingClaim({
      ...clm,
      claimAmount: clm.claimAmount || clm.amount || '',
      settlementAmount: clm.settlementAmount || '',
      status: clm.status || 'SUBMITTED'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingClaim || !editingClaim.id) return;
    await updateClaim(editingClaim);
    setShowEditModal(false);
    setEditingClaim(null);
    alert(`Claim ${editingClaim.id} updated successfully! Directly reflected in Customer 360.`);
  };

  const handleUpdateClaimStatus = (id, newStatus) => {
    updateClaimStatus(id, newStatus);
  };

  const handleDeleteClaimDesk = (id) => {
    if (window.confirm(`Are you sure you want to delete claim ${id}? This will remove it from both Claims Desk and Customer 360.`)) {
      deleteClaim(id);
    }
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
            onClick={handleOpenAddModal}
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
                {activeFiltersCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-extrabold flex items-center space-x-1 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
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
                <th className="p-4">Insurer &amp; Type</th>
                <th className="p-4">Claim Amount</th>
                <th className="p-4">Settled Amount</th>
                <th className="p-4">Assigned Staff / Officer</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
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
                      onClick={() => openCustomer360(c.customerName, 'CLAIMS')}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile (Claims Tab)"
                    >
                      <span>{c.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                    {c.hospitalOrGarage && (
                      <p className="text-[10px] text-slate-400 font-medium">{c.hospitalOrGarage}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-extrabold text-slate-900">{c.insuranceCompany}</p>
                    <span className="badge bg-slate-100 text-slate-700 text-[9px] font-bold">{c.claimType || 'Insurance Claim'}</span>
                  </td>
                  <td className="p-4 font-mono font-black text-slate-900">₹{Number(c.claimAmount || 0).toLocaleString()}</td>
                  <td className="p-4 font-mono font-black text-emerald-700">
                    {Number(c.settlementAmount || 0) > 0 ? `₹${Number(c.settlementAmount).toLocaleString()}` : <span className="text-slate-400 font-normal">Pending</span>}
                  </td>
                  <td className="p-4">
                    <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-blue-600 shrink-0" />
                      <span>{c.assignedStaff || 'Priya Sharma'}</span>
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <select 
                      value={c.status || 'SUBMITTED'} 
                      onChange={(e) => handleUpdateClaimStatus(c.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer outline-none ${
                        c.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        c.status === 'APPROVED' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        c.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="SETTLED">SETTLED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button 
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Edit Claim Details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClaimDesk(c.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Claim Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILE NEW CLAIM MODAL (LINKED TO CUSTOMER 360 & POLICIES) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>File Insurance Claim Request</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-3" autoComplete="off">
              {/* CUSTOMER NAME WITH STRICT TYPING AUTOCOMPLETE */}
              <div ref={custWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    value={newClaim.customerName} 
                    onFocus={() => {
                      if (newClaim.customerName && newClaim.customerName.trim().length > 0) {
                        setShowCustSuggest(true);
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewClaim({...newClaim, customerName: val});
                      if (val.trim().length > 0) {
                        setShowCustSuggest(true);
                      } else {
                        setShowCustSuggest(false);
                        setAvailableCustomerPolicies([]);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Suggestions Dropdown - ONLY appears when user has typed meaningful text */}
                {showCustSuggest && newClaim.customerName && newClaim.customerName.trim().length > 0 && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Matching Customers ({filteredCustomers.length})</span>
                      <button 
                        type="button"
                        onClick={() => setShowCustSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredCustomers.map((cust, idx) => (
                      <div 
                        key={cust.id || idx}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center">
                            {cust.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{cust.name}</p>
                            <p className="text-[10px] text-slate-400">{cust.customerCode || cust.id} • {cust.phone || 'No Phone'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-600">Select &amp; Link</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CUSTOMER POLICIES DROPDOWN IF CUSTOMER HAS MULTIPLE OR REGISTERED POLICIES */}
              {availableCustomerPolicies.length > 0 && (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-blue-950 flex items-center space-x-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      <span>Select Policy ({availableCustomerPolicies.length} Active Policies Found) *</span>
                    </label>
                    <span className="badge bg-blue-200 text-blue-900 text-[10px] font-black">Customer 360 Linked</span>
                  </div>
                  <select 
                    value={newClaim.policyNo}
                    onChange={(e) => handleSelectPolicy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="">-- Choose Policy to File Claim Under --</option>
                    {availableCustomerPolicies.map((pol, pIdx) => (
                      <option key={pol.id || pol.policyNo || pIdx} value={pol.id || pol.policyNo}>
                        {pol.id || pol.policyNo} — {pol.insuranceCompany} ({pol.policyName || pol.planName || pol.type || 'Policy'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={newClaim.policyNo} 
                    onChange={(e) => setNewClaim({...newClaim, policyNo: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider *</label>
                  <input 
                    type="text" 
                    required 
                    value={newClaim.insuranceCompany} 
                    onChange={(e) => setNewClaim({...newClaim, insuranceCompany: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={newClaim.claimAmount} 
                    onChange={(e) => setNewClaim({...newClaim, claimAmount: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Hospital / Garage / Provider</label>
                  <input 
                    type="text" 
                    value={newClaim.hospitalOrGarage} 
                    onChange={(e) => setNewClaim({...newClaim, hospitalOrGarage: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Claims Officer</label>
                <select 
                  value={newClaim.assignedStaff} 
                  onChange={(e) => setNewClaim({...newClaim, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">Select Assigned Staff / Officer</option>
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Karthik Subramanian (Claims Head)">Karthik Subramanian (Claims Head)</option>
                  <option value="Anitha S. (Claim Specialist)">Anitha S. (Claim Specialist)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                  <option value="Rahul Dravid (Staff Advisor)">Rahul Dravid (Staff Advisor)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Submit Claim &amp; Sync to Customer 360</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLAIM MODAL */}
      {showEditModal && editingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span>Edit Claim Details ({editingClaim.id})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Status</label>
                  <select 
                    value={editingClaim.status || 'SUBMITTED'} 
                    onChange={(e) => setEditingClaim({...editingClaim, status: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-black outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="SETTLED">SETTLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Settled Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editingClaim.settlementAmount || ''} 
                    onChange={(e) => setEditingClaim({...editingClaim, settlementAmount: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={editingClaim.claimAmount || ''} 
                    onChange={(e) => setEditingClaim({...editingClaim, claimAmount: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Hospital / Garage / Provider</label>
                  <input 
                    type="text" 
                    value={editingClaim.hospitalOrGarage || ''} 
                    onChange={(e) => setEditingClaim({...editingClaim, hospitalOrGarage: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editingClaim.customerName || ''} 
                    onChange={(e) => setEditingClaim({...editingClaim, customerName: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Number</label>
                  <input 
                    type="text" 
                    required 
                    value={editingClaim.policyNo || ''} 
                    onChange={(e) => setEditingClaim({...editingClaim, policyNo: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Claims Staff</label>
                <select 
                  value={editingClaim.assignedStaff || ''} 
                  onChange={(e) => setEditingClaim({...editingClaim, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">Select Assigned Claims Staff</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                  <option value="Karthik Subramanian (Claims Head)">Karthik Subramanian (Claims Head)</option>
                  <option value="Anitha S. (Claim Specialist)">Anitha S. (Claim Specialist)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                  <option value="Rahul Dravid (Staff Advisor)">Rahul Dravid (Staff Advisor)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Changes &amp; Sync to Customer 360</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
