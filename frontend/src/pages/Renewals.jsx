import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { 
  Search, Send, CheckCircle2, Clock, ShieldAlert, UserCheck, Sparkles, 
  ShieldCheck, AlertTriangle, ArrowUpRight, Phone, CheckCircle, RefreshCw, Calendar
} from 'lucide-react';

export const Renewals = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { policies } = useData();

  const [renewalsStatusMap, setRenewalsStatusMap] = useState({});
  const [remindersMap, setRemindersMap] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DUE_SOON, EXPIRED, RENEWED
  const [toastMessage, setToastMessage] = useState(null);

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

  const filtered = renewalsList.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.policyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'DUE_SOON') return r.status === 'DUE_SOON';
    if (statusFilter === 'EXPIRED') return r.status === 'EXPIRED';
    if (statusFilter === 'RENEWED') return r.status === 'RENEWED';

    return true;
  });

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
            <span className="text-[11px] font-black uppercase text-rose-200 tracking-wider">Urgent / Expired</span>
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

      {/* Search & Filter Tabs Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Client Name, Phone, Policy No or Insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter('DUE_SOON')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${statusFilter === 'DUE_SOON' ? 'bg-amber-500 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            ⏳ Due Soon
          </button>
          <button 
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${statusFilter === 'EXPIRED' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🚨 Urgent / Expired
          </button>
          <button 
            onClick={() => setStatusFilter('RENEWED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${statusFilter === 'RENEWED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            ✅ Renewed
          </button>
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
