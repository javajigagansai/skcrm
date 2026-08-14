import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { Search, Send, CheckCircle2, Clock, ShieldAlert, UserCheck, Sparkles } from 'lucide-react';

export const Renewals = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { policies } = useData();

  const [renewalsStatusMap, setRenewalsStatusMap] = useState({});
  const [remindersMap, setRemindersMap] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const renewalsList = policies.map(p => ({
    id: `RNW-${p.id}`,
    policyNo: p.id,
    customerName: p.customerName,
    phone: p.phone || '9876543210',
    type: p.type || 'Insurance Policy',
    insuranceCompany: p.insuranceCompany || 'Tata AIA / Star Health',
    premium: p.grossPremium || 25000,
    dueDate: p.expiryDate || '2026-09-01',
    assignedStaff: p.assignedStaff || 'Priya Sharma (Senior Advisor)',
    status: renewalsStatusMap[p.id] || (new Date(p.expiryDate) < new Date() ? 'EXPIRED' : 'DUE_SOON'),
    reminderSent: !!remindersMap[p.id]
  }));

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
      `To ensure your coverage remains active without any interruption or penalty, please contact us or reply to this message to renew your policy.\n\n` +
      `📞 *Help Desk:* +91 98765 43210\n` +
      `🌐 *Portal:* https://sk-crm-1.web.app\n\n` +
      `Thank you for trusting SK Smart Investments! 🙏`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');

    setRemindersMap(prev => ({ ...prev, [r.policyNo]: true }));
    setToastMessage(`WhatsApp renewal notice dispatched for ${r.customerName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkRenewed = (policyNo, name) => {
    setRenewalsStatusMap(prev => ({ ...prev, [policyNo]: 'RENEWED' }));
    setToastMessage(`Policy for ${name} marked as RENEWED successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = renewalsList.filter(r =>
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.policyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-slate-200 cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Policy Renewals Desk</h1>
          <p className="text-xs text-slate-500 font-semibold">Track upcoming insurance policy renewals and send automated reminder notices.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Client Name, Phone or Policy No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Policy &amp; Client</th>
                <th className="p-4">Category</th>
                <th className="p-4">Renewal Premium</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Follow-up Staff / Officer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <button
                      onClick={() => openCustomer360(r.customerName)}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile"
                    >
                      <span>{r.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{r.policyNo}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{r.type}</td>
                  <td className="p-4 font-mono font-black text-emerald-700">₹{r.premium.toLocaleString()}</td>
                  <td className="p-4 font-bold text-rose-600">{r.dueDate}</td>
                  <td className="p-4">
                    <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-purple-600 shrink-0" />
                      <span>{r.assignedStaff || 'Priya Sharma (Senior Advisor)'}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${r.status === 'RENEWED' ? 'badge-green' : r.status === 'DUE_SOON' ? 'badge-red' : 'badge-amber'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {r.status !== 'RENEWED' && (
                      <>
                        <button 
                          onClick={() => handleSendWhatsAppNotice(r)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] cursor-pointer inline-flex items-center space-x-1.5 shadow-xs transition"
                          title="Open WhatsApp with personalized customer greeting and policy renewal details"
                        >
                          <Send className="h-3 w-3" />
                          <span>{r.reminderSent ? 'Resend WhatsApp Notice' : 'Send WhatsApp Notice'}</span>
                        </button>
                        <button 
                          onClick={() => handleMarkRenewed(r.policyNo, r.customerName)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold text-[11px] cursor-pointer inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Mark Renewed</span>
                        </button>
                      </>
                    )}
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
