import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { 
  PartyPopper, Sparkles, Send, CheckCircle2, Check, Cake, Heart, PhoneCall, Mail, UserCheck, Users, ShieldCheck 
} from 'lucide-react';

const DEFAULT_STAFF_CELEBRATIONS = [];

export const SpecialDays = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS' | 'STAFF'

  const [dailyReportStatus, setDailyReportStatus] = useState(() => {
    const saved = localStorage.getItem('crm_v2_daily_greetings_status');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [staffCelebrations, setStaffCelebrations] = useState(() => {
    const saved = localStorage.getItem('crm_v2_staff_celebrations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const sampleEvents = [];

  const handleCompleteAllWishes = () => {
    const statusObj = {
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      officer: user?.name || 'Greetings Officer',
      count: sampleEvents.length + staffCelebrations.length,
      date: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('crm_v2_daily_greetings_status', JSON.stringify(statusObj));
    setDailyReportStatus(statusObj);
    alert(`Daily Greetings Status Updated!\n\nAll today's customer & staff colleague special day wishes have been completed and reported up-to-date to Super Admin!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/20">
              <Sparkles className="h-4 w-4" />
              <span>Greetings Officer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Birthdays &amp; Anniversaries Portal</h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
              Dedicated module for <strong>Greetings Officers</strong> &amp; <strong>Super Admin</strong>. Express gratitude to leads, customers, and staff colleagues on their special days!
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-2xl font-black text-amber-300 block">{sampleEvents.length}</span>
              <span className="text-[10px] uppercase font-bold text-blue-100">Today</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-2xl font-black text-emerald-300 block">{staffCelebrations.length}</span>
              <span className="text-[10px] uppercase font-bold text-blue-100">Next 7 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'CUSTOMERS' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PartyPopper className="h-4 w-4" />
            <span>Customer &amp; Family Special Days ({sampleEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'STAFF' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Staff &amp; Colleague Celebrations ({staffCelebrations.length})</span>
          </button>
        </div>

        <span className="text-xs font-extrabold text-slate-500 hidden sm:inline">Greetings Officer: Anitha Selvam</span>
      </div>

      {/* Admin Reporting Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-500/30">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <CheckCircle2 className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm flex items-center space-x-2">
              <span>Daily Greetings &amp; Admin Update Center</span>
              <span className="badge bg-amber-400 text-slate-900 text-[10px] font-black uppercase">Live Sync</span>
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {dailyReportStatus?.status === 'COMPLETED' 
                ? `100% Up to Date! Reported to Admin by ${dailyReportStatus.officer} at ${dailyReportStatus.timestamp}`
                : `Click button once all today's special day wishes are sent to notify Admin that greetings are 100% up-to-date.`}
            </p>
          </div>
        </div>

        <button
          onClick={handleCompleteAllWishes}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg transition flex items-center space-x-2 cursor-pointer shrink-0 ${
            dailyReportStatus?.status === 'COMPLETED'
              ? 'bg-white text-emerald-900 shadow-md hover:bg-emerald-50'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-900 ring-4 ring-amber-400/30'
          }`}
        >
          <Check className="h-4 w-4" />
          <span>{dailyReportStatus?.status === 'COMPLETED' ? "Report Sent: All Wishes Up-To-Date!" : "Mark All Today's Wishes Completed & Notify Admin"}</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS SPECIAL DAYS */}
      {activeTab === 'CUSTOMERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {sampleEvents.map(evt => (
            <div key={evt.id} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className={`badge ${evt.type === 'BIRTHDAY' ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-800'} text-[10px] font-black`}>
                  {evt.type === 'BIRTHDAY' ? '🎂 Birthday' : '💍 Anniversary'}
                </span>
                <span className="text-[11px] text-slate-400 font-extrabold">{evt.date}</span>
              </div>

              <div>
                <button
                  onClick={() => openCustomer360(evt.name)}
                  className="text-base font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                  title="Click to view Customer 360° Profile"
                >
                  <span>{evt.name}</span>
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 opacity-80" />
                </button>
                <p className="text-xs text-slate-500">{evt.entity} • {evt.plan}</p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">{evt.mobile}</p>
              </div>

              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`Happy ${evt.type === 'BIRTHDAY' ? 'Birthday' : 'Wedding Anniversary'} ${evt.name}! 🎂 Warm wishes from SK Investment CRM!`);
                  window.open(`https://api.whatsapp.com/send?phone=${evt.mobile.replace(/[^0-9]/g, '')}&text=${msg}`, '_blank');
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Wish Customer via WhatsApp</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 2: STAFF & COLLEAGUE CELEBRATIONS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {staffCelebrations.map((stf, idx) => (
            <div key={stf.id || idx} className="bg-white p-5 rounded-3xl border border-blue-100 shadow-card space-y-4 relative hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className={`badge ${stf.type === 'ANNIVERSARY' ? 'bg-rose-100 text-rose-800' : 'bg-pink-100 text-pink-700'} text-[10px] font-black`}>
                  {stf.type === 'ANNIVERSARY' ? '💍 Wedding Anniversary' : '🎂 Colleague Birthday'}
                </span>
                <span className="badge bg-blue-50 text-blue-700 text-[9px] font-bold">Staff Member</span>
              </div>

              <div className="flex items-center space-x-3">
                <img 
                  src={stf.avatar || stf.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'} 
                  alt={stf.name}
                  className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">{stf.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{stf.role}</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">{stf.date}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`Happy ${stf.type === 'ANNIVERSARY' ? 'Wedding Anniversary' : 'Birthday'} ${stf.name}! 🥳🎉 Wishing you happiness and great success from your SK CRM family!`);
                  window.open(`https://api.whatsapp.com/send?phone=${(stf.mobile || stf.phone || '+91 98111 22233').replace(/[^0-9]/g, '')}&text=${msg}`, '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Wish Colleague via WhatsApp</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
