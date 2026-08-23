import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportRenewalsExcel } from '../utils/exportUtils';
import { 
  Search, Send, CheckCircle2, Clock, ShieldAlert, UserCheck, Sparkles, 
  ShieldCheck, AlertTriangle, ArrowUpRight, Phone, CheckCircle, RefreshCw, Calendar,
  Filter, RotateCcw, Download, FileSpreadsheet, MessageCircle, AlertCircle, ExternalLink
} from 'lucide-react';

export const Renewals = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { policies } = useData();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [renewalsStatusMap, setRenewalsStatusMap] = useState({});
  const [remindersMap, setRemindersMap] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterInsurer, setFilterInsurer] = useState('ALL');
  const [filterPremiumRange, setFilterPremiumRange] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterType('ALL');
    setFilterInsurer('ALL');
    setFilterPremiumRange('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const renewalsList = useMemo(() => {
    return (policies || []).map(p => {
      const isPast = p.expiryDate ? new Date(p.expiryDate) < new Date() : false;
      const rawStatus = renewalsStatusMap[p.id] || (isPast ? 'EXPIRED' : 'DUE_SOON');
      return {
        id: `RNW-${p.id}`,
        policyNo: p.id,
        customerName: p.customerName || 'Valued Client',
        phone: p.phone || '9876543210',
        type: p.type || 'LIFE',
        insuranceCompany: p.insuranceCompany || 'Tata AIA Life',
        policyName: p.salesPitch || p.planName || p.policyName || '',
        premium: Number(p.grossPremium) || 25000,
        dueDate: p.expiryDate || '2026-09-01',
        assignedStaff: p.assignedStaff || 'Priya Sharma (Senior Advisor)',
        status: rawStatus,
        reminderSent: !!remindersMap[p.id]
      };
    });
  }, [policies, renewalsStatusMap, remindersMap]);

  const handleSendWhatsAppNotice = (r) => {
    const rawPhone = (r.phone || '9876543210').replace(/\D/g, '');
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const message = `Hello *${r.customerName}*, 👋✨\n\n` +
      `Warm Greetings from *SK Smart Investments*! 🌟\n\n` +
      `We hope you are doing well! This is a friendly reminder regarding your upcoming policy renewal.\n\n` +
      `📌 *Policy Renewal Details:*\n` +
      `• *Policy Number:* ${r.policyNo}\n` +
      `• *Insurance Provider:* ${r.insuranceCompany}\n` +
      `• *Policy Category:* ${r.type}\n` +
      `• *Renewal Premium:* ₹${Number(r.premium).toLocaleString()}\n` +
      `• *Due Date:* ${r.dueDate}\n` +
      `• *Assigned Advisor:* ${r.assignedStaff}\n\n` +
      `To ensure your policy coverage remains active without any interruption or gap, please contact us or reply to this message to renew your policy.\n\n` +
      `📞 *Help Desk:* +91 98765 43210\n` +
      `🌐 *Portal:* https://sk-crm-1.web.app\n\n` +
      `Thank you for trusting SK Smart Investments! 🙏`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');

    setRemindersMap(prev => ({ ...prev, [r.policyNo]: true }));
    setToastMessage(`WhatsApp renewal notice dispatched to ${r.customerName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkRenewed = (policyNo, name) => {
    setRenewalsStatusMap(prev => ({ ...prev, [policyNo]: 'RENEWED' }));
    setToastMessage(`Policy for ${name} marked as RENEWED successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const uniqueInsurers = useMemo(() => {
    const set = new Set();
    renewalsList.forEach(r => { if (r.insuranceCompany) set.add(r.insuranceCompany); });
    return Array.from(set);
  }, [renewalsList]);

  const filtered = useMemo(() => {
    return renewalsList.filter(r => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        (r.customerName || '').toLowerCase().includes(term) ||
        (r.policyNo || '').toLowerCase().includes(term) ||
        (r.phone || '').includes(term) ||
        (r.insuranceCompany || '').toLowerCase().includes(term) ||
        (r.type || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;

      if (filterType !== 'ALL') {
        const t = (r.type || '').toLowerCase();
        if (filterType === 'LIFE' && !t.includes('life')) return false;
        if (filterType === 'HEALTH' && !t.includes('health') && !t.includes('medical')) return false;
        if (filterType === 'MOTOR' && !t.includes('motor') && !t.includes('car') && !t.includes('vehicle')) return false;
        if (filterType === 'OTHER' && (t.includes('life') || t.includes('health') || t.includes('motor'))) return false;
      }

      if (filterInsurer !== 'ALL') {
        if (!(r.insuranceCompany || '').toLowerCase().includes(filterInsurer.toLowerCase())) return false;
      }

      if (filterPremiumRange !== 'ALL') {
        const prem = Number(r.premium || 0);
        if (filterPremiumRange === 'BELOW_10K' && prem >= 10000) return false;
        if (filterPremiumRange === '10K_50K' && (prem < 10000 || prem > 50000)) return false;
        if (filterPremiumRange === 'ABOVE_50K' && prem <= 50000) return false;
      }

      if (filterStartDate) {
        if (r.dueDate && r.dueDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (r.dueDate && r.dueDate > filterEndDate) return false;
      }

      return true;
    });
  }, [renewalsList, searchTerm, filterStatus, filterType, filterInsurer, filterPremiumRange, filterStartDate, filterEndDate]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterType !== 'ALL' ? 1 : 0) +
    (filterInsurer !== 'ALL' ? 1 : 0) +
    (filterPremiumRange !== 'ALL' ? 1 : 0) +
    (filterStartDate ? 1 : 0) +
    (filterEndDate ? 1 : 0);

  // KPI Metrics
  const totalDueCount = renewalsList.filter(r => r.status === 'DUE_SOON').length;
  const totalExpiredCount = renewalsList.filter(r => r.status === 'EXPIRED').length;
  const totalRenewedCount = renewalsList.filter(r => r.status === 'RENEWED').length;
  const totalRenewalSum = renewalsList.reduce((s, r) => s + r.premium, 0);

  const getDueBadge = (dueDateStr, status) => {
    if (status === 'RENEWED') {
      return { text: 'Renewed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue ${Math.abs(diffDays)}d`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'bg-amber-100 text-amber-900 border-amber-300 font-black' };
    }
    if (diffDays <= 7) {
      return { text: `In ${diffDays} days`, color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' };
    }
    return { text: `In ${diffDays} days`, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-slate-200 cursor-pointer">✕</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
            <RefreshCw className="h-6 w-6 text-blue-600" />
            <span>Policy Renewals &amp; Retention Desk</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Track policy expiry dates, follow up with clients, and dispatch renewal reminders via WhatsApp.
          </p>
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
                onClick={() => exportRenewalsExcel(filtered)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Policies Card */}
        <div 
          onClick={() => setFilterStatus('ALL')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:shadow-md ${
            filterStatus === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Total Active Policies</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{renewalsList.length}</p>
          <p className="text-xs font-bold text-slate-500 mt-1">₹{(totalRenewalSum / 100000).toFixed(2)} Lakhs Total Premium</p>
        </div>

        {/* Due Soon Card */}
        <div 
          onClick={() => setFilterStatus('DUE_SOON')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:shadow-md ${
            filterStatus === 'DUE_SOON' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">Due for Renewal</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{totalDueCount}</p>
          <p className="text-xs font-bold text-amber-700/80 mt-1">Pending Follow-up &amp; Notice</p>
        </div>

        {/* Expired Card */}
        <div 
          onClick={() => setFilterStatus('EXPIRED')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:shadow-md ${
            filterStatus === 'EXPIRED' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-700 tracking-wider">Expired / Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{totalExpiredCount}</p>
          <p className="text-xs font-bold text-rose-700/80 mt-1">Immediate Action Required</p>
        </div>

        {/* Renewed Success Card */}
        <div 
          onClick={() => setFilterStatus('RENEWED')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer shadow-xs hover:shadow-md ${
            filterStatus === 'RENEWED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">Successfully Renewed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{totalRenewedCount}</p>
          <p className="text-xs font-bold text-emerald-700/80 mt-1">Coverage Maintained Active</p>
        </div>

      </div>

      {/* Advanced Filter Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Search &amp; Filter Renewals
            </h3>
            {activeFiltersCount > 0 && (
              <span className="badge badge-brand text-[10px] font-black px-2 py-0.5">
                {activeFiltersCount} Active
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-extrabold flex items-center space-x-1 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Client Name, Phone, Policy No, Insurer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none bg-white"
              />
            </div>
          </div>

          {/* Renewal Status */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Renewal Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="EXPIRED">Expired / Overdue</option>
              <option value="RENEWED">Renewed</option>
            </select>
          </div>

          {/* Policy Category */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Policy Category</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="LIFE">Life Insurance</option>
              <option value="HEALTH">Health Insurance</option>
              <option value="MOTOR">Motor Insurance</option>
              <option value="OTHER">Other Policies</option>
            </select>
          </div>

          {/* Insurance Company */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Insurance Provider</label>
            <select
              value={filterInsurer}
              onChange={(e) => setFilterInsurer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Providers</option>
              {uniqueInsurers.map((ins, i) => (
                <option key={i} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Date Range Custom Filter */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-xs shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Expiry Date Range:</span>
          </div>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Clear Date
            </button>
          )}
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filtered.length}</strong> of <strong className="text-slate-900">{renewalsList.length}</strong> total renewal records</span>
          {filtered.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching policy renewals found.</span>
          )}
        </div>
      </div>

      {/* Master Renewals Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Customer &amp; Policy</th>
                <th className="p-4">Insurance Provider &amp; Plan</th>
                <th className="p-4">Renewal Premium</th>
                <th className="p-4">Expiry Due Date</th>
                <th className="p-4">Assigned Advisor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Renewal Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filtered.length > 0 ? (
                filtered.map(r => {
                  const isExpired = r.status === 'EXPIRED';
                  const isRenewed = r.status === 'RENEWED';
                  const dueBadge = getDueBadge(r.dueDate, r.status);

                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-50/80 transition ${
                        isExpired ? 'bg-rose-50/20' : isRenewed ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Customer & Policy */}
                      <td className="p-4">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {r.customerName?.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => openCustomer360(r.customerName, 'RENEWALS')}
                              className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                              title="Click to view Customer 360° Profile (Renewals Tab)"
                            >
                              <span>{r.customerName}</span>
                              <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                            </button>
                            <p className="text-[11px] text-slate-400 font-mono font-semibold">{r.policyNo}</p>
                            <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <a href={`tel:${r.phone}`} className="hover:text-blue-600 font-medium">{r.phone}</a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Insurer & Plan */}
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{r.insuranceCompany}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className={`badge text-[9px] font-black ${
                            r.type === 'HEALTH' ? 'bg-orange-100 text-orange-800' :
                            r.type === 'MOTOR' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {r.type}
                          </span>
                          {r.policyName && (
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]" title={r.policyName}>
                              • {r.policyName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Premium */}
                      <td className="p-4 font-mono font-black text-slate-900 text-sm">
                        ₹{Number(r.premium).toLocaleString()}
                      </td>

                      {/* Due Date & Countdown */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.dueDate}</p>
                        {dueBadge && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${dueBadge.color}`}>
                            {dueBadge.text}
                          </span>
                        )}
                      </td>

                      {/* Assigned Advisor */}
                      <td className="p-4">
                        <span className="badge bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                          <UserCheck className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>{r.assignedStaff}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {isRenewed ? (
                          <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl">
                            RENEWED
                          </span>
                        ) : isExpired ? (
                          <span className="badge bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-1 rounded-xl">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="badge bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-xl">
                            DUE SOON
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {!isRenewed ? (
                            <>
                              <button 
                                onClick={() => handleSendWhatsAppNotice(r)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center space-x-1 shadow-xs transition"
                                title="Open WhatsApp with personalized customer greeting and renewal details"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>{r.reminderSent ? 'Resend Notice' : 'Send WhatsApp'}</span>
                              </button>

                              <button 
                                onClick={() => handleMarkRenewed(r.policyNo, r.customerName)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center space-x-1 shadow-xs transition"
                                title="Mark policy as renewed"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Renewed</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-emerald-600 font-extrabold flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span>Renewed</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-400 font-medium">
                    No policy renewals match your current search &amp; filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
