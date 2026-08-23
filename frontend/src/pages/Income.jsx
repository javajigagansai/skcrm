import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { fetchIncomeBackend } from '../services/apiService';
import { exportFollowupsPDF, exportIncomeExcel } from '../utils/exportUtils';
import { Plus, TrendingUp, IndianRupee, Search, Filter, RotateCcw, FileSpreadsheet, Download, Building2, CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';

export const Income = () => {
  const { user } = useAuth();
  const { income: contextIncome } = useData();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterAmountRange, setFilterAmountRange] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterCompany('ALL');
    setFilterAmountRange('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const loadIncome = async () => {
    setLoading(true);
    try {
      const data = await fetchIncomeBackend();
      if (Array.isArray(data) && data.length > 0) {
        setIncomeList(data);
      } else {
        setIncomeList(contextIncome || sampleIncomeData);
      }
    } catch (err) {
      setIncomeList(contextIncome || sampleIncomeData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
  }, [contextIncome]);

  const sampleIncomeData = [
    { id: 'INC-2026-101', date: '2026-08-15', clientName: 'Rahul Sharma', customerName: 'Rahul Sharma', category: 'Insurance Brokerage', payorCompany: 'Tata AIA Life Insurance', amount: 18500, tdsAmount: 925, netAmount: 17575, assignedStaffName: 'Prakash Gajendiran', status: 'RECEIVED' },
    { id: 'INC-2026-102', date: '2026-08-12', clientName: 'Priya Menon', customerName: 'Priya Menon', category: 'Health Insurance Commission', payorCompany: 'Star Health Insurance', amount: 12400, tdsAmount: 620, netAmount: 11780, assignedStaffName: 'Priya Sharma', status: 'RECEIVED' },
    { id: 'INC-2026-103', date: '2026-08-10', clientName: 'Anand Kumar', customerName: 'Anand Kumar', category: 'Mutual Fund Trail Brokerage', payorCompany: 'SBI Mutual Fund AMC', amount: 24500, tdsAmount: 1225, netAmount: 23275, assignedStaffName: 'Prakash Gajendiran', status: 'RECEIVED' },
    { id: 'INC-2026-104', date: '2026-08-08', clientName: 'Kavitha Reddy', customerName: 'Kavitha Reddy', category: 'Motor Insurance Commission', payorCompany: 'HDFC ERGO General', amount: 8900, tdsAmount: 445, netAmount: 8455, assignedStaffName: 'Priya Sharma', status: 'RECEIVED' },
    { id: 'INC-2026-105', date: '2026-08-05', clientName: 'Suresh Verma', customerName: 'Suresh Verma', category: 'Financial Planning Fee', payorCompany: 'Direct Consultancy', amount: 15000, tdsAmount: 750, netAmount: 14250, assignedStaffName: 'Prakash Gajendiran', status: 'RECEIVED' }
  ];

  const displayList = incomeList.length > 0 ? incomeList : sampleIncomeData;

  const filteredIncome = useMemo(() => {
    return displayList.filter(inc => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (inc.id || '').toLowerCase().includes(term) ||
        (inc.customerName || inc.clientName || '').toLowerCase().includes(term) ||
        (inc.payorCompany || inc.companyName || '').toLowerCase().includes(term) ||
        (inc.category || inc.incomeType || '').toLowerCase().includes(term) ||
        (inc.assignedStaffName || '').toLowerCase().includes(term);

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
        if (inc.date && inc.date < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (inc.date && inc.date > filterEndDate) return false;
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
    return filteredIncome.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
  }, [filteredIncome]);

  const totalNetIncome = useMemo(() => {
    return filteredIncome.reduce((sum, inc) => sum + Number(inc.netAmount || inc.amount || 0), 0);
  }, [filteredIncome]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Income &amp; Brokerage Register</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
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
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
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

      {/* CUSTOMER 360 STYLE ADVANCED MULTI-FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Customer 360° Income Filters
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
                placeholder="Voucher No, Client Name, Payor Insurer, Category..."
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
            <span>Date:</span>
          </div>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
            placeholder="dd-mm-yyyy"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
            placeholder="dd-mm-yyyy"
          />
          <button
            type="button"
            onClick={() => {}}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center"
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
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Clear Date
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
                <th className="p-4">Voucher No &amp; Date</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Category &amp; Payor</th>
                <th className="p-4">Gross Commission</th>
                <th className="p-4">Net Received</th>
                <th className="p-4">Assigned Advisor</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredIncome.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <p className="font-mono font-extrabold text-slate-900">{inc.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{inc.date || inc.receivedDate || '2026-08-15'}</p>
                  </td>
                  <td className="p-4 font-black text-slate-900">{inc.customerName || inc.clientName || 'Direct Client'}</td>
                  <td className="p-4">
                    <span className="badge badge-purple text-[10px] block w-fit mb-1">{inc.category || inc.incomeType || 'Commission'}</span>
                    <span className="text-[10px] font-bold text-slate-500">{inc.payorCompany || 'Tata AIA Life'}</span>
                  </td>
                  <td className="p-4 font-mono font-extrabold text-slate-900">₹{Number(inc.amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono font-extrabold text-emerald-600">₹{Number(inc.netAmount || inc.amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-slate-700">{inc.assignedStaffName || 'Prakash Gajendiran'}</td>
                  <td className="p-4">
                    <span className="badge badge-green text-[10px] flex items-center space-x-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{inc.status || 'RECEIVED'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
