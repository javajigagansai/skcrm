import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportIncomeExcel } from '../utils/exportUtils';
import { 
  Plus, TrendingUp, IndianRupee, Search, Filter, RotateCcw, FileSpreadsheet, 
  Download, Building2, CheckCircle2, ShieldCheck, Calendar, Clock, Edit3, Trash2, X, Save, AlertCircle, UserCheck 
} from 'lucide-react';

const COMMON_COMPANIES = [
  'Tata AIA Life Insurance',
  'HDFC Life Insurance',
  'Star Health and Allied Insurance',
  'Niva Bupa Health Insurance',
  'Care Health Insurance',
  'ICICI Prudential Life',
  'ICICI Lombard General',
  'Bajaj Allianz General',
  'HDFC Mutual Fund & AMC',
  'SBI Mutual Fund',
  'Nippon India Mutual Fund',
  'Aditya Birla Sun Life'
];

const COMMON_CATEGORIES = [
  'Insurance Brokerage & Commission',
  'Life Insurance Commission',
  'Health Insurance Commission',
  'Mutual Fund Trail Fee',
  'Financial Planning Consulting',
  'Renewal Brokerage Commission',
  'Motor Insurance Brokerage',
  'Other Advisory Income'
];

const formatTime = (timeStr, createdAt) => {
  if (timeStr && String(timeStr).trim()) return timeStr;
  if (createdAt) {
    try {
      return new Date(createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {}
  }
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const Income = () => {
  const { user } = useAuth();
  const { 
    income: contextIncome, 
    addIncome, 
    updateIncome, 
    deleteIncome, 
    staffList: contextStaff = [], 
    users = [] 
  } = useData();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Build a complete and resilient list of registered advisors / staff strictly from real live data
  const effectiveStaffList = useMemo(() => {
    const list = [];
    const namesSeen = new Set();

    const addStaff = (st) => {
      if (!st) return;
      const name = (typeof st === 'string' ? st : (st.name || st.displayName || st.email || '')).trim();
      if (name && !namesSeen.has(name.toLowerCase())) {
        namesSeen.add(name.toLowerCase());
        list.push(typeof st === 'string' ? { name, role: 'Advisor' } : { ...st, name });
      }
    };

    if (Array.isArray(contextStaff)) contextStaff.forEach(addStaff);
    if (Array.isArray(users)) users.forEach(addStaff);

    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) parsed.forEach(addStaff);
      }
    } catch (e) {}

    if (user?.name) addStaff({ name: user.name, role: user.role || 'Admin' });

    return list;
  }, [contextStaff, users, user]);

  const defaultAdvisorName = user?.name || (effectiveStaffList.length > 0 ? effectiveStaffList[0].name : '');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterAmountRange, setFilterAmountRange] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form state for creating new income voucher
  const [newIncomeForm, setNewIncomeForm] = useState({
    customerName: '',
    payorCompany: 'Tata AIA Life Insurance',
    category: 'Insurance Brokerage & Commission',
    amount: '',
    netAmount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    assignedStaffName: defaultAdvisorName,
    status: 'RECEIVED',
    description: ''
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterCompany('ALL');
    setFilterAmountRange('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const displayList = Array.isArray(contextIncome) ? contextIncome : [];

  const filteredIncome = useMemo(() => {
    return (displayList || []).filter(inc => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (inc.id || '').toLowerCase().includes(term) ||
        (inc.customerName || inc.clientName || '').toLowerCase().includes(term) ||
        (inc.payorCompany || inc.companyName || '').toLowerCase().includes(term) ||
        (inc.category || inc.incomeType || '').toLowerCase().includes(term) ||
        (inc.assignedStaffName || '').toLowerCase().includes(term) ||
        String(inc.time || '').toLowerCase().includes(term) ||
        String(inc.amount || '').includes(term);

      if (!matchesSearch) return false;

      if (filterCategory !== 'ALL') {
        const catLower = (inc.category || inc.incomeType || '').toLowerCase();
        if (filterCategory === 'COMMISSION' && !catLower.includes('brokerage') && !catLower.includes('commission') && !catLower.includes('insurance')) return false;
        if (filterCategory === 'MUTUAL_FUNDS' && !catLower.includes('fund') && !catLower.includes('trail') && !catLower.includes('sip')) return false;
        if (filterCategory === 'CONSULTING' && !catLower.includes('fee') && !catLower.includes('consult') && !catLower.includes('plan')) return false;
      }

      if (filterCompany !== 'ALL') {
        const comp = (inc.payorCompany || inc.companyName || '').toLowerCase();
        if (!comp.includes(filterCompany.toLowerCase())) return false;
      }

      if (filterAmountRange !== 'ALL') {
        const amt = Number(inc.amount || 0);
        if (filterAmountRange === 'BELOW_10K' && amt >= 10000) return false;
        if (filterAmountRange === '10K_50K' && (amt < 10000 || amt > 50000)) return false;
        if (filterAmountRange === 'ABOVE_50K' && amt <= 50000) return false;
      }

      if (filterStartDate) {
        const d = inc.date || inc.receivedDate;
        if (d && d < filterStartDate) return false;
      }
      if (filterEndDate) {
        const d = inc.date || inc.receivedDate;
        if (d && d > filterEndDate) return false;
      }

      return true;
    });
  }, [displayList, searchTerm, filterCategory, filterCompany, filterAmountRange, filterStartDate, filterEndDate]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterCategory !== 'ALL' ? 1 : 0) +
    (filterCompany !== 'ALL' ? 1 : 0) +
    (filterAmountRange !== 'ALL' ? 1 : 0) +
    (filterStartDate ? 1 : 0) +
    (filterEndDate ? 1 : 0);

  const totalGrossIncome = useMemo(() => {
    return filteredIncome.reduce((sum, inc) => sum + Number(inc.amount || inc.grossAmount || 0), 0);
  }, [filteredIncome]);

  const totalNetIncome = useMemo(() => {
    return filteredIncome.reduce((sum, inc) => sum + Number(inc.netAmount || inc.amount || 0), 0);
  }, [filteredIncome]);

  // Handle Edit Action
  const handleOpenEdit = (inc) => {
    setEditingIncome({
      ...inc,
      amount: Number(inc.amount || inc.grossAmount || 0),
      netAmount: Number(inc.netAmount !== undefined ? inc.netAmount : Math.round(Number(inc.amount || 0) * 0.95)),
      date: inc.date || inc.receivedDate || new Date().toISOString().split('T')[0],
      time: inc.time || formatTime('', inc.createdAt),
      customerName: inc.customerName || inc.clientName || '',
      payorCompany: inc.payorCompany || inc.companyName || 'Tata AIA Life Insurance',
      category: inc.category || inc.incomeType || 'Insurance Brokerage & Commission',
      assignedStaffName: inc.assignedStaffName || defaultAdvisorName,
      status: inc.status || 'RECEIVED'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingIncome || !editingIncome.id) return;

    try {
      const grossAmt = Number(editingIncome.amount || 0);
      const netAmt = Number(editingIncome.netAmount !== undefined ? editingIncome.netAmount : Math.round(grossAmt * 0.95));

      const updatedPayload = {
        ...editingIncome,
        amount: grossAmt,
        grossAmount: grossAmt,
        netAmount: netAmt,
        date: editingIncome.date || new Date().toISOString().split('T')[0],
        receivedDate: editingIncome.date || new Date().toISOString().split('T')[0],
        time: editingIncome.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        customerName: editingIncome.customerName ? String(editingIncome.customerName).trim().toUpperCase() : 'DIRECT CLIENT',
        clientName: editingIncome.customerName ? String(editingIncome.customerName).trim().toUpperCase() : 'DIRECT CLIENT',
        assignedStaffName: editingIncome.assignedStaffName || defaultAdvisorName
      };

      if (typeof updateIncome === 'function') {
        await updateIncome(editingIncome.id, updatedPayload);
      }

      setEditingIncome(null);
      alert('Income & brokerage voucher updated successfully!');
    } catch (err) {
      alert('Error updating income record: ' + err.message);
    }
  };

  // Handle Create New Income
  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      const grossAmt = Number(newIncomeForm.amount || 0);
      const netAmt = Number(newIncomeForm.netAmount !== undefined && newIncomeForm.netAmount > 0 ? newIncomeForm.netAmount : Math.round(grossAmt * 0.95));

      const newRecord = {
        ...newIncomeForm,
        amount: grossAmt,
        grossAmount: grossAmt,
        netAmount: netAmt,
        date: newIncomeForm.date || new Date().toISOString().split('T')[0],
        receivedDate: newIncomeForm.date || new Date().toISOString().split('T')[0],
        time: newIncomeForm.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        customerName: (newIncomeForm.customerName || 'DIRECT CLIENT').trim().toUpperCase(),
        clientName: (newIncomeForm.customerName || 'DIRECT CLIENT').trim().toUpperCase(),
        assignedStaffName: newIncomeForm.assignedStaffName || defaultAdvisorName
      };

      if (typeof addIncome === 'function') {
        await addIncome(newRecord);
      }

      setShowAddModal(false);
      setNewIncomeForm({
        customerName: '',
        payorCompany: 'Tata AIA Life Insurance',
        category: 'Insurance Brokerage & Commission',
        amount: '',
        netAmount: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        assignedStaffName: defaultAdvisorName,
        status: 'RECEIVED',
        description: ''
      });
      alert('Income & brokerage voucher recorded successfully!');
    } catch (err) {
      alert('Error recording income: ' + err.message);
    }
  };

  // Handle Delete Action
  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income voucher record?')) return;
    try {
      if (typeof deleteIncome === 'function') {
        await deleteIncome(id);
      }
      alert('Income voucher deleted successfully.');
    } catch (err) {
      alert('Error deleting income: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="h-7 w-7 text-emerald-600" />
            <span>Income &amp; Brokerage Register</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Real-time brokerage inflows, policy commissions, trail fees, and financial ledger vouchers with precise dates &amp; timestamps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button 
                onClick={() => {
                  setNewIncomeForm(prev => ({
                    ...prev,
                    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    assignedStaffName: defaultAdvisorName
                  }));
                  setShowAddModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Record New Income Voucher"
              >
                <Plus className="h-4 w-4" />
                <span>Record Brokerage Income</span>
              </button>

              <button 
                onClick={() => exportFollowupsPDF(filteredIncome)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button 
                onClick={() => exportIncomeExcel(filteredIncome)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Gross Commission</span>
          <p className="text-2xl font-black text-slate-900">₹ {totalGrossIncome.toLocaleString('en-IN')}</p>
          <span className="badge badge-brand text-[10px]">Gross Revenue Disbursed</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Net Income Realized (Post TDS)</span>
          <p className="text-2xl font-black text-emerald-600">₹ {totalNetIncome.toLocaleString('en-IN')}</p>
          <span className="badge badge-green text-[10px]">Net Bank Inflow</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Income Entries</span>
          <p className="text-2xl font-black text-slate-900">{filteredIncome.length}</p>
          <span className="badge badge-purple text-[10px]">Commission Vouchers</span>
        </div>
      </div>

      {/* SEARCH FILTERS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Income &amp; Brokerage Search Filters
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
                placeholder="Voucher No, Client Name, Payor Insurer, Advisor, Time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Income Category Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Income Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="COMMISSION">Insurance Brokerage &amp; Commission</option>
              <option value="MUTUAL_FUNDS">Mutual Fund Trail Fee</option>
              <option value="CONSULTING">Financial Planning Fee</option>
            </select>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Commission Amount</label>
            <select
              value={filterAmountRange}
              onChange={(e) => setFilterAmountRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Amounts</option>
              <option value="BELOW_10K">Below ₹10,000</option>
              <option value="10K_50K">₹10,000 - ₹50,000</option>
              <option value="ABOVE_50K">Above ₹50,000</option>
            </select>
          </div>

        </div>

        {/* Date Range Custom Filter */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-xs shrink-0">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Date Range:</span>
          </div>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Clear Date Filter
            </button>
          )}
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filteredIncome.length}</strong> of <strong className="text-slate-900">{displayList.length}</strong> total income vouchers</span>
          {filteredIncome.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching income records found.</span>
          )}
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Voucher No, Date &amp; Time</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Category &amp; Payor</th>
                <th className="p-4">Gross Commission</th>
                <th className="p-4">Net Received</th>
                <th className="p-4">Assigned Advisor</th>
                <th className="p-4">Status</th>
                {isAdmin && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredIncome.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4">
                    <p className="font-mono font-extrabold text-slate-900">{inc.id}</p>
                    <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-500 font-bold mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{inc.date || inc.receivedDate || 'Today'}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center space-x-1 text-blue-700 font-black bg-blue-50/80 border border-blue-200/60 px-1.5 py-0.5 rounded-md">
                        <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                        <span>{formatTime(inc.time, inc.createdAt)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-black text-slate-900">{inc.customerName || inc.clientName || 'Direct Client'}</td>
                  <td className="p-4">
                    <span className="badge badge-purple text-[10px] block w-fit mb-1">{inc.category || inc.incomeType || 'Commission'}</span>
                    <span className="text-[10px] font-bold text-slate-500">{inc.payorCompany || inc.companyName || 'Insurance Provider'}</span>
                  </td>
                  <td className="p-4 font-mono font-extrabold text-slate-900">₹{Number(inc.amount || inc.grossAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono font-extrabold text-emerald-600">₹{Number(inc.netAmount || inc.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{inc.assignedStaffName || 'Advisor'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="badge badge-green text-[10px] flex items-center space-x-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{inc.status || 'RECEIVED'}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition cursor-pointer shadow-2xs"
                          title="Edit Income Voucher"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
                          title="Delete Income Voucher"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= EDIT INCOME VOUCHER MODAL ================= */}
      {editingIncome && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Income &amp; Brokerage Voucher</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Voucher ID: <span className="font-mono text-blue-600 font-bold">{editingIncome.id}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setEditingIncome(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  value={editingIncome.customerName || ''}
                  onChange={(e) => setEditingIncome({ ...editingIncome, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Client Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Payor / Provider Company *</label>
                  <input
                    type="text"
                    required
                    list="company-options"
                    value={editingIncome.payorCompany || ''}
                    onChange={(e) => setEditingIncome({ ...editingIncome, payorCompany: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="company-options">
                    {COMMON_COMPANIES.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Income Category *</label>
                  <input
                    type="text"
                    required
                    list="category-options"
                    value={editingIncome.category || ''}
                    onChange={(e) => setEditingIncome({ ...editingIncome, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="category-options">
                    {COMMON_CATEGORIES.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Commission Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editingIncome.amount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingIncome({
                        ...editingIncome,
                        amount: val,
                        netAmount: Math.round(val * 0.95)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Gross Amount"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Net Received (Post TDS ₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editingIncome.netAmount !== undefined ? editingIncome.netAmount : Math.round(Number(editingIncome.amount || 0) * 0.95)}
                    onChange={(e) => setEditingIncome({ ...editingIncome, netAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Net Received Amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>Received Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingIncome.date || ''}
                    onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Received Time</span>
                  </label>
                  <input
                    type="text"
                    value={editingIncome.time || ''}
                    onChange={(e) => setEditingIncome({ ...editingIncome, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 03:30 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Assigned Advisor / Staff *
                </label>
                <select
                  required
                  value={editingIncome.assignedStaffName || defaultAdvisorName}
                  onChange={(e) => setEditingIncome({ ...editingIncome, assignedStaffName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">-- Select Advisor / Staff --</option>
                  {effectiveStaffList.map((st, i) => (
                    <option key={st.id || st.uid || i} value={st.name}>
                      {st.name} {st.role ? `(${st.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Payment Status</label>
                <select
                  value={editingIncome.status || 'RECEIVED'}
                  onChange={(e) => setEditingIncome({ ...editingIncome, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="RECEIVED">RECEIVED (Disbursed &amp; Credited to Bank)</option>
                  <option value="PENDING">PENDING (Awaiting Insurer / AMC Payout)</option>
                  <option value="PROCESSING">PROCESSING (Under Reconciliation)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECORD NEW INCOME VOUCHER MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record New Income / Brokerage</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Generate a new commission inflow voucher in the company ledger.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncome} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  value={newIncomeForm.customerName}
                  onChange={(e) => setNewIncomeForm({ ...newIncomeForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Client Name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Payor / Provider Company *</label>
                  <input
                    type="text"
                    required
                    list="new-company-options"
                    value={newIncomeForm.payorCompany}
                    onChange={(e) => setNewIncomeForm({ ...newIncomeForm, payorCompany: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="new-company-options">
                    {COMMON_COMPANIES.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Income Category *</label>
                  <input
                    type="text"
                    required
                    list="new-category-options"
                    value={newIncomeForm.category}
                    onChange={(e) => setNewIncomeForm({ ...newIncomeForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="new-category-options">
                    {COMMON_CATEGORIES.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Commission Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newIncomeForm.amount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewIncomeForm({
                        ...newIncomeForm,
                        amount: val,
                        netAmount: Math.round(val * 0.95)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Gross Amount"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Net Received (Post TDS ₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newIncomeForm.netAmount || ''}
                    onChange={(e) => setNewIncomeForm({ ...newIncomeForm, netAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Net Received Amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>Received Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newIncomeForm.date}
                    onChange={(e) => setNewIncomeForm({ ...newIncomeForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Received Time</span>
                  </label>
                  <input
                    type="text"
                    value={newIncomeForm.time || ''}
                    onChange={(e) => setNewIncomeForm({ ...newIncomeForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 03:30 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Assigned Advisor / Staff *
                </label>
                <select
                  required
                  value={newIncomeForm.assignedStaffName || defaultAdvisorName}
                  onChange={(e) => setNewIncomeForm({ ...newIncomeForm, assignedStaffName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">-- Select Advisor / Staff --</option>
                  {effectiveStaffList.map((st, i) => (
                    <option key={st.id || st.uid || i} value={st.name}>
                      {st.name} {st.role ? `(${st.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Income Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
