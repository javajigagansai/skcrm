import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportRenewalsExcel } from '../utils/exportUtils';
import { 
  Search, Send, CheckCircle2, Clock, ShieldAlert, UserCheck, Sparkles, 
  ShieldCheck, AlertTriangle, ArrowUpRight, Phone, CheckCircle, RefreshCw, Calendar,
  Filter, RotateCcw, Download, FileSpreadsheet
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
  const [toastMessage, setToastMessage] = useState(null);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterType('ALL');
    setFilterInsurer('ALL');
    setFilterPremiumRange('ALL');
  };

  const renewalsList = (policies || []).map(p => {
    const rawStatus = renewalsStatusMap[p.id] || (new Date(p.expiryDate) < new Date() ? 'EXPIRED' : 'DUE_SOON');
    return {
      id: `RNW-${p.id}`,
      policyNo: p.id,
      customerName: p.customerName || 'Valued Client',
      phone: p.phone || '9876543210',
      type: p.type || 'LIFE',
      insuranceCompany: p.insuranceCompany || 'Tata AIA Life',
      premium: Number(p.grossPremium) || 25000,
      dueDate: p.expiryDate || '2026-09-01',
      assignedStaff: p.assignedStaff || 'Priya Sharma (Senior Advisor)',
      status: rawStatus,
      reminderSent: !!remindersMap[p.id]
    };
  });

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

      return true;
    });
  }, [renewalsList, searchTerm, filterStatus, filterType, filterInsurer, filterPremiumRange]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterType !== 'ALL' ? 1 : 0) +
    (filterInsurer !== 'ALL' ? 1 : 0) +
    (filterPremiumRange !== 'ALL' ? 1 : 0);

  // KPI Metrics
  const totalDueCount = renewalsList.filter(r => r.status === 'DUE_SOON').length;
  const totalExpiredCount = renewalsList.filter(r => r.status === 'EXPIRED').length;
  const totalRenewedCount = renewalsList.filter(r => r.status === 'RENEWED').length;
  const totalRenewalSum = renewalsList.reduce((s, r) => s + r.premium, 0);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin-slow" />
            <span>Policy Renewals &amp; Retention Desk</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Track upcoming insurance policy renewals, dispatch automated WhatsApp reminders, and protect client coverage.</p>
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
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5 rounded-3xl shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-blue-200 tracking-wider">Total Policy Desk</span>
            <ShieldCheck className="h-5 w-5 text-blue-200" />
          </div>
          <p className="text-2xl font-black">{renewalsList.length} Policies</p>
          <p className="text-xs font-semibold text-blue-100">Total Premium: ₹{(totalRenewalSum / 100000).toFixed(2)} Lakhs</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-5 rounded-3xl shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-100 tracking-wider">Due Soon (Next 30 Days)</span>
            <Clock className="h-5 w-5 text-amber-100" />
          </div>
          <p className="text-2xl font-black">{totalDueCount} Policies</p>
          <p className="text-xs font-semibold text-amber-100">Action: Dispatch Reminders</p>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white p-5 rounded-3xl shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-200 tracking-wider">Expired</span>
            <AlertTriangle className="h-5 w-5 text-rose-200" />
          </div>
          <p className="text-2xl font-black">{totalExpiredCount} Policies</p>
          <p className="text-xs font-semibold text-rose-100">Requires Immediate Follow-up</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-3xl shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-200 tracking-wider">Renewed Success</span>
            <CheckCircle className="h-5 w-5 text-emerald-200" />
          </div>
          <p className="text-2xl font-black">{totalRenewedCount} Completed</p>
          <p className="text-xs font-semibold text-emerald-100">Coverage Kept Active ✅</p>
        </div>
      </div>

      {/* CUSTOMER 360 STYLE ADVANCED MULTI-FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Customer 360° Renewal Filters
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
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
              <option value="DUE_SOON">⏳ Due Soon</option>
              <option value="EXPIRED">🚨 Expired</option>
              <option value="RENEWED">✅ Renewed</option>
            </select>
          </div>

          {/* Policy Type */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Policy Category</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="LIFE">Life Insurance</option>
              <option value="HEALTH">Health / Medical</option>
              <option value="MOTOR">Motor / Vehicle</option>
              <option value="OTHER">Other Policies</option>
            </select>
          </div>

          {/* Premium Range */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Renewal Premium</label>
            <select
              value={filterPremiumRange}
              onChange={(e) => setFilterPremiumRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">All Premium Ranges</option>
              <option value="BELOW_10K">Below ₹10,000</option>
              <option value="10K_50K">₹10,000 – ₹50,000</option>
              <option value="ABOVE_50K">Above ₹50,000</option>
            </select>
          </div>

        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filtered.length}</strong> of <strong className="text-slate-900">{renewalsList.length}</strong> total renewal policies</span>
          {filtered.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching renewal policies found.</span>
          )}
        </div>
      </div>

      {/* Master Renewals Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 border-r border-slate-800">Policy &amp; Client</th>
                <th className="p-4 border-r border-slate-800">Insurance Provider</th>
                <th className="p-4 border-r border-slate-800">Renewal Premium</th>
                <th className="p-4 border-r border-slate-800">Due Date</th>
                <th className="p-4 border-r border-slate-800">Follow-up Staff Advisor</th>
                <th className="p-4 border-r border-slate-800">Renewal Status</th>
                <th className="p-4 text-center">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
              {filtered.length > 0 ? (
                filtered.map(r => {
                  const isExpired = r.status === 'EXPIRED';
                  const isRenewed = r.status === 'RENEWED';
                  return (
                    <tr 
                      key={r.id} 
                      className={`transition ${isExpired ? 'bg-rose-50/50 hover:bg-rose-100/50' : isRenewed ? 'bg-emerald-50/40 hover:bg-emerald-100/40' : 'hover:bg-blue-50/50'}`}
                    >
                      <td className="p-4 border-r border-slate-200/80">
                        <button
                          onClick={() => openCustomer360(r.customerName)}
                          className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1 text-sm"
                          title="Click to view Customer 360° Profile"
                        >
                          <span>{r.customerName}</span>
                          <Sparkles className="h-3.5 w-3.5 text-blue-500 opacity-80" />
                        </button>
                        <p className="text-[11px] text-slate-500 font-mono font-bold mt-0.5">{r.policyNo}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.phone}</p>
                      </td>

                      <td className="p-4 border-r border-slate-200/80">
                        <p className="font-extrabold text-blue-950 flex items-center space-x-1">
                          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{r.insuranceCompany}</span>
                        </p>
                        <span className={`badge text-[10px] font-black mt-1 ${r.type === 'HEALTH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                          {r.type} Policy
                        </span>
                      </td>

                      <td className="p-4 font-mono font-black text-emerald-700 text-sm border-r border-slate-200/80">
                        ₹{r.premium.toLocaleString()}
                      </td>

                      <td className="p-4 border-r border-slate-200/80">
                        <span className={`font-black flex items-center space-x-1 ${isExpired ? 'text-rose-600' : 'text-amber-700'}`}>
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{r.dueDate}</span>
                        </span>
                      </td>

                      <td className="p-4 border-r border-slate-200/80">
                        <span className="badge bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2.5 py-1 rounded-xl inline-flex items-center space-x-1 shadow-2xs">
                          <UserCheck className="h-3 w-3 text-purple-700 shrink-0" />
                          <span>{r.assignedStaff}</span>
                        </span>
                      </td>

                      <td className="p-4 border-r border-slate-200/80">
                        {isRenewed ? (
                          <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-xl">
                            ✅ RENEWED
                          </span>
                        ) : isExpired ? (
                          <span className="badge bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-1 rounded-xl animate-pulse">
                            🚨 EXPIRED (URGENT)
                          </span>
                        ) : (
                          <span className="badge bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-xl">
                            ⏳ DUE SOON
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {!isRenewed && (
                            <>
                              <button 
                                onClick={() => handleSendWhatsAppNotice(r)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs cursor-pointer inline-flex items-center space-x-1.5 shadow-md hover:shadow-lg transition transform active:scale-95"
                                title="Open WhatsApp with personalized customer greeting and policy renewal details"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>{r.reminderSent ? 'Resend WhatsApp' : 'Send WhatsApp'}</span>
                              </button>

                              <button 
                                onClick={() => handleMarkRenewed(r.policyNo, r.customerName)}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer inline-flex items-center space-x-1 shadow-md hover:shadow-lg transition transform active:scale-95"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Renewed</span>
                              </button>
                            </>
                          )}
                          {isRenewed && (
                            <span className="text-xs text-emerald-600 font-extrabold flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-400">
                    No policy renewals match your current search &amp; status filter criteria.
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
