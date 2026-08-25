import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportInvestmentsExcel } from '../utils/exportUtils';
import { 
  Plus, Search, CheckCircle2, Briefcase, IndianRupee, ShieldCheck, 
  Clock, X, Edit3, Trash2, Building2, Download, Sparkles, ExternalLink,
  Filter, RotateCcw, FileSpreadsheet
} from 'lucide-react';

export const Investments = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { investments, addInvestment, updateInvestmentStatus, deleteInvestment } = useData();
  const isManagerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Dynamic Investment Providers / AMCs List
  const [investmentProviders, setInvestmentProviders] = useState(() => {
    const saved = localStorage.getItem('crm_v2_investment_providers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      'HDFC Mutual Fund & AMC',
      'SBI Mutual Fund',
      'ICICI Prudential AMC',
      'Axis Mutual Fund',
      'Nippon India Mutual Fund',
      'Parag Parikh Flexi Cap AMC',
      'UTI Mutual Fund',
      'Tata Mutual Fund',
      'Mirae Asset Mutual Fund',
      'Kotak Mahindra AMC',
      'SBI Fixed Deposit Desk',
      'HDFC Bank FD & Bonds'
    ];
  });

  const [newProviderName, setNewProviderName] = useState('');
  const [showManageProvidersModal, setShowManageProvidersModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAmountRange, setFilterAmountRange] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterProvider('ALL');
    setFilterStatus('ALL');
    setFilterAmountRange('ALL');
  };

  // New Investment Form State
  const [newInv, setNewInv] = useState({
    customerName: '',
    provider: '',
    customProvider: '',
    type: '',
    customType: '',
    amount: '',
    folioNumber: '',
    status: 'PENDING'
  });

  const saveProvidersToStorage = (list) => {
    setInvestmentProviders(list);
    localStorage.setItem('crm_v2_investment_providers', JSON.stringify(list));
  };

  const handleAddProvider = (e) => {
    e.preventDefault();
    if (!newProviderName.trim()) return;
    if (investmentProviders.includes(newProviderName.trim())) {
      alert("This Fund House / AMC already exists in the registry!");
      return;
    }
    const updated = [...investmentProviders, newProviderName.trim()];
    saveProvidersToStorage(updated);
    setNewProviderName('');
    alert(`Investment Provider "${newProviderName.trim()}" added successfully!`);
  };

  const handleDeleteProvider = (provName) => {
    if (window.confirm(`Are you sure you want to remove "${provName}" from the investment providers registry?`)) {
      const updated = investmentProviders.filter(p => p !== provName);
      saveProvidersToStorage(updated);
    }
  };

  const handleCreateInvestment = async (e) => {
    e.preventDefault();
    const providerName = newInv.provider === 'CUSTOM' ? newInv.customProvider : newInv.provider;
    const categoryType = newInv.type === 'CUSTOM' ? newInv.customType : newInv.type;

    if (!providerName || !newInv.customerName) {
      alert("Please specify Customer Name and Investment Provider / AMC!");
      return;
    }

    const createdObj = await addInvestment({
      customerName: newInv.customerName,
      provider: providerName,
      type: categoryType,
      amount: Number(newInv.amount),
      folioNumber: newInv.folioNumber || 'FOL-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PENDING',
      advisorName: user?.name || 'Staff Advisor'
    });

    if (newInv.provider === 'CUSTOM' && newInv.customProvider && !investmentProviders.includes(newInv.customProvider)) {
      saveProvidersToStorage([...investmentProviders, newInv.customProvider]);
    }

    setShowAddModal(false);
    resetNewInvForm();
    alert(`Investment portfolio recorded for ${createdObj.customerName}!`);
  };

  const resetNewInvForm = () => {
    setNewInv({
      customerName: '',
      provider: 'HDFC Mutual Fund & AMC',
      customProvider: '',
      type: 'SIP Mutual Fund',
      customType: '',
      amount: 100000,
      folioNumber: 'FOL-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PENDING'
    });
  };

  const handleSaveEditInvestment = (e) => {
    e.preventDefault();
    if (!editingInvestment) return;

    const providerName = editingInvestment.provider === 'CUSTOM' ? editingInvestment.customProvider : editingInvestment.provider;
    const categoryType = editingInvestment.type === 'CUSTOM' ? editingInvestment.customType : editingInvestment.type;

    const updatedObj = {
      ...editingInvestment,
      provider: providerName,
      type: categoryType,
      amount: Number(editingInvestment.amount)
    };

    setInvestments(investments.map(inv => inv.id === updatedObj.id ? updatedObj : inv));
    setShowEditModal(false);
    setEditingInvestment(null);
    alert(`Investment ${updatedObj.id} updated successfully!`);
  };

  const handleApprove = async (id) => {
    try {
      await approveInvestmentBackend(id).catch(() => {});
      setInvestments(investments.map(inv => inv.id === id ? { ...inv, status: 'ACTIVE', approvedByName: user?.name || 'Branch Manager' } : inv));
      alert('Investment approved & activated successfully!');
    } catch (err) {
      setInvestments(investments.map(inv => inv.id === id ? { ...inv, status: 'ACTIVE', approvedByName: user?.name || 'Branch Manager' } : inv));
      alert('Investment approved!');
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (window.confirm(`Are you sure you want to delete investment record ${id}?`)) {
      if (deleteInvestment) {
        await deleteInvestment(id);
      }
    }
  };

  const filteredInvestments = useMemo(() => {
    return (investments || []).filter(inv => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (inv.customerName || '').toLowerCase().includes(term) ||
        (inv.id || '').toLowerCase().includes(term) ||
        (inv.provider || '').toLowerCase().includes(term) ||
        (inv.type || inv.category || '').toLowerCase().includes(term) ||
        (inv.folioNumber || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterCategory !== 'ALL') {
        const catLower = (inv.type || inv.category || '').toLowerCase();
        if (filterCategory === 'MUTUAL_FUNDS' && !catLower.includes('fund') && !catLower.includes('sip') && !catLower.includes('equity')) return false;
        if (filterCategory === 'FIXED_DEPOSIT' && !catLower.includes('fd') && !catLower.includes('fixed') && !catLower.includes('bond')) return false;
        if (filterCategory === 'REAL_ESTATE' && !catLower.includes('real') && !catLower.includes('gold') && !catLower.includes('sgb')) return false;
      }

      if (filterProvider !== 'ALL') {
        const provName = (inv.provider || '').toLowerCase();
        if (!provName.includes(filterProvider.toLowerCase())) return false;
      }

      if (filterStatus !== 'ALL') {
        const invStatus = (inv.status || 'ACTIVE').toUpperCase();
        if (filterStatus === 'ACTIVE' && invStatus !== 'ACTIVE') return false;
        if (filterStatus === 'PENDING' && invStatus !== 'PENDING') return false;
        if (filterStatus === 'MATURED' && invStatus !== 'MATURED' && invStatus !== 'REDEEMED') return false;
      }

      if (filterAmountRange !== 'ALL') {
        const amt = Number(inv.amount || 0);
        if (filterAmountRange === 'BELOW_50K' && amt >= 50000) return false;
        if (filterAmountRange === '50K_2L' && (amt < 50000 || amt > 200000)) return false;
        if (filterAmountRange === '2L_10L' && (amt < 200000 || amt > 1000000)) return false;
        if (filterAmountRange === 'ABOVE_10L' && amt <= 1000000) return false;
      }

      return true;
    });
  }, [investments, searchTerm, filterCategory, filterProvider, filterStatus, filterAmountRange]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterCategory !== 'ALL' ? 1 : 0) +
    (filterProvider !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterAmountRange !== 'ALL' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Investment Portfolios Register</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button 
                onClick={() => exportFollowupsPDF(filteredInvestments)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button 
                onClick={() => exportInvestmentsExcel(filteredInvestments)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}

          <button 
            onClick={() => setShowManageProvidersModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs shadow-xs border border-purple-200 transition cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-purple-600" />
            <span>Manage AMCs / Providers ({investmentProviders.length})</span>
          </button>

          {user?.role !== 'VIEWER' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record New Investment</span>
            </button>
          )}
        </div>
      </div>

      {/* CUSTOMER 360 STYLE ADVANCED MULTI-FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Customer 360° Investment Filters
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Search Bar */}
          <div className="sm:col-span-2 lg:col-span-2 relative">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Folio No, Client, AMC House, Asset Category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Asset Category Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Asset Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Asset Types</option>
              <option value="MUTUAL_FUNDS">Mutual Funds &amp; SIPs</option>
              <option value="FIXED_DEPOSIT">Fixed Deposits &amp; Bonds</option>
              <option value="REAL_ESTATE">Real Estate &amp; Gold SGB</option>
            </select>
          </div>

          {/* AMC / Provider Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">AMC / Fund House</label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All AMC / Providers</option>
              {investmentProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Investment Amount</label>
            <select
              value={filterAmountRange}
              onChange={(e) => setFilterAmountRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Amounts</option>
              <option value="BELOW_50K">Below ₹50,000</option>
              <option value="50K_2L">₹50,000 - ₹2,00,000</option>
              <option value="2L_10L">₹2,00,000 - ₹10,00,000</option>
              <option value="ABOVE_10L">Above ₹10,00,000</option>
            </select>
          </div>

        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filteredInvestments.length}</strong> of <strong className="text-slate-900">{investments.length}</strong> total investment folios</span>
          {filteredInvestments.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching investment records found.</span>
          )}
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Investment ID &amp; Customer</th>
                <th className="p-4">Fund House / AMC &amp; Scheme</th>
                <th className="p-4">Portfolio Amount</th>
                <th className="p-4">Folio Number</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions &amp; Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredInvestments.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4">
                    <button
                      onClick={() => openCustomer360(inv.customerName)}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile"
                    >
                      <span>{inv.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {inv.id}</p>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-slate-800 flex items-center space-x-1">
                      <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{inv.provider || 'HDFC Mutual Fund'}</span>
                    </p>
                    <span className="badge badge-brand text-[10px] mt-1">{inv.type}</span>
                  </td>

                  <td className="p-4 font-mono font-black text-emerald-700">
                    ₹{Number(inv.amount).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4 font-mono text-slate-600">
                    {inv.folioNumber || 'FOL-992104'}
                  </td>

                  <td className="p-4">
                    <span className={`badge ${inv.status === 'ACTIVE' ? 'badge-green' : inv.status === 'PENDING' ? 'badge-amber' : 'badge-brand'}`}>
                      {inv.status}
                    </span>
                  </td>

                  <td className="p-4 text-right space-x-2">
                    {inv.status === 'PENDING' && isManagerOrAdmin && (
                      <button 
                        onClick={() => handleApprove(inv.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow transition inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setEditingInvestment({
                          ...inv,
                          customProvider: '',
                          customType: ''
                        });
                        setShowEditModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-extrabold text-[11px] transition cursor-pointer"
                      title="Edit Investment Details"
                    >
                      <Edit3 className="h-3.5 w-3.5 inline" />
                    </button>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] transition cursor-pointer"
                        title="Delete Investment Record"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MANAGE AMCs & PROVIDERS MODAL ================= */}
      {showManageProvidersModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span>AMCs &amp; Investment Providers Directory</span>
              </h3>
              <button onClick={() => setShowManageProvidersModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Add New Provider Form */}
            <form onSubmit={handleAddProvider} className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-600">Add New AMC / Fund House / Provider</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Parag Parikh / Kotak Mutual Fund"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* Providers List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border-t pt-3">
              <span className="text-[11px] font-black uppercase text-slate-500 block mb-1">Active AMCs &amp; Fund Houses ({investmentProviders.length})</span>
              {investmentProviders.map((prov, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  <span className="flex items-center space-x-2">
                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>{prov}</span>
                  </span>

                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteProvider(prov)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Provider"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowManageProvidersModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECORD NEW INVESTMENT MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Record New Investment Portfolio</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter Customer Full Name"
                  value={newInv.customerName} 
                  onChange={(e) => setNewInv({...newInv, customerName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                />
              </div>

              {/* Fund House Provider Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Fund House / AMC / Bank Provider</label>
                <select 
                  value={newInv.provider} 
                  onChange={(e) => setNewInv({...newInv, provider: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {investmentProviders.map((prov, idx) => (
                    <option key={idx} value={prov}>{prov}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom AMC / Provider...</option>
                </select>

                {newInv.provider === 'CUSTOM' && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom fund house / AMC name..."
                    value={newInv.customProvider}
                    onChange={(e) => setNewInv({...newInv, customProvider: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                )}
              </div>

              {/* Category Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Investment Category / Scheme</label>
                <select 
                  value={newInv.type} 
                  onChange={(e) => setNewInv({...newInv, type: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="SIP Mutual Fund">SIP Mutual Fund 📈</option>
                  <option value="Lumpsum Mutual Fund">Lumpsum Mutual Fund 💰</option>
                  <option value="Fixed Deposit (FD)">Fixed Deposit (FD) 🏦</option>
                  <option value="Govt Sovereign Bonds">Govt Sovereign Bonds 🛡️</option>
                  <option value="Corporate Debt Bonds">Corporate Debt Bonds 📜</option>
                  <option value="Real Estate REIT">Real Estate REIT 🏢</option>
                  <option value="CUSTOM">+ Write / Enter Custom Investment Category...</option>
                </select>

                {newInv.type === 'CUSTOM' && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom investment category..."
                    value={newInv.customType}
                    onChange={(e) => setNewInv({...newInv, customType: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Investment Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={newInv.amount} 
                    onChange={(e) => setNewInv({...newInv, amount: Number(e.target.value)})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Folio / Account Number</label>
                  <input 
                    type="text" 
                    value={newInv.folioNumber} 
                    onChange={(e) => setNewInv({...newInv, folioNumber: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Save Investment (Submit for Manager Approval)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT INVESTMENT MODAL ================= */}
      {showEditModal && editingInvestment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span>Edit Investment Record ({editingInvestment.id})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditInvestment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={editingInvestment.customerName} 
                  onChange={(e) => setEditingInvestment({...editingInvestment, customerName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>

              {/* Fund House Provider Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Fund House / AMC / Bank Provider</label>
                <select 
                  value={investmentProviders.includes(editingInvestment.provider) ? editingInvestment.provider : 'CUSTOM'} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setEditingInvestment({...editingInvestment, provider: 'CUSTOM', customProvider: editingInvestment.provider});
                    } else {
                      setEditingInvestment({...editingInvestment, provider: val, customProvider: ''});
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {investmentProviders.map((prov, idx) => (
                    <option key={idx} value={prov}>{prov}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom AMC / Provider...</option>
                </select>

                {(editingInvestment.provider === 'CUSTOM' || !investmentProviders.includes(editingInvestment.provider)) && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom provider name..."
                    value={editingInvestment.customProvider || editingInvestment.provider}
                    onChange={(e) => setEditingInvestment({...editingInvestment, customProvider: e.target.value, provider: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Investment Category Input */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Investment Scheme / Category</label>
                <input 
                  type="text"
                  required
                  value={editingInvestment.type}
                  onChange={(e) => setEditingInvestment({...editingInvestment, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Investment Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingInvestment.amount} 
                    onChange={(e) => setEditingInvestment({...editingInvestment, amount: Number(e.target.value)})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Folio / Account Number</label>
                  <input 
                    type="text" 
                    value={editingInvestment.folioNumber} 
                    onChange={(e) => setEditingInvestment({...editingInvestment, folioNumber: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Approval Status</label>
                <select 
                  value={editingInvestment.status}
                  onChange={(e) => setEditingInvestment({...editingInvestment, status: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Approved)</option>
                  <option value="PENDING">PENDING (Awaiting Approval)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Save Investment Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
