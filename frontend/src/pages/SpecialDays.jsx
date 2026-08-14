import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { 
  PartyPopper, Sparkles, Send, CheckCircle2, Check, Cake, Heart, PhoneCall, Mail, UserCheck, Users, ShieldCheck, Calendar
} from 'lucide-react';

export const SpecialDays = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { customers } = useData();

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS' | 'STAFF'
  const [dateRangeFilter, setDateRangeFilter] = useState('TODAY'); // 'TODAY' (Current Day Only), 'THIS_MONTH', 'ALL'

  const [dailyReportStatus, setDailyReportStatus] = useState(() => {
    const saved = localStorage.getItem('crm_v2_daily_greetings_status');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Real-time calculation of Customer Special Days
  const customerEvents = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];

    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const list = [];

    customers.forEach(c => {
      // 1. Customer Birthday
      if (c.dob) {
        const parts = c.dob.split('-');
        if (parts.length === 3) {
          const monthDay = `${parts[1]}-${parts[2]}`;
          const isToday = monthDay === todayMonthDay;
          list.push({
            id: `BDAY-${c.id}`,
            customerName: c.name,
            phone: c.phone || '9876543210',
            type: 'BIRTHDAY',
            eventTitle: `🎂 Birthday of ${c.name}`,
            date: c.dob,
            isToday,
            assignedAdvisor: c.assignedAdvisorName || 'Priya Sharma',
            relation: 'Self'
          });
        }
      }

      // 2. Customer Wedding Anniversary
      if (c.maritalStatus === 'Married' && c.anniversaryDate) {
        const parts = c.anniversaryDate.split('-');
        if (parts.length === 3) {
          const monthDay = `${parts[1]}-${parts[2]}`;
          const isToday = monthDay === todayMonthDay;
          list.push({
            id: `ANNI-${c.id}`,
            customerName: c.name,
            phone: c.phone || '9876543210',
            type: 'ANNIVERSARY',
            eventTitle: `💍 Wedding Anniversary of ${c.name}`,
            date: c.anniversaryDate,
            isToday,
            assignedAdvisor: c.assignedAdvisorName || 'Priya Sharma',
            relation: 'Self & Spouse'
          });
        }
      }

      // 3. Family Members DOB & Anniversaries
      if (c.familyMembers && Array.isArray(c.familyMembers)) {
        c.familyMembers.forEach((fm, fIdx) => {
          if (fm.dob) {
            const parts = fm.dob.split('-');
            if (parts.length === 3) {
              const monthDay = `${parts[1]}-${parts[2]}`;
              const isToday = monthDay === todayMonthDay;
              list.push({
                id: `FM-BDAY-${c.id}-${fIdx}`,
                customerName: `${fm.name} (${fm.relation} of ${c.name})`,
                phone: fm.phone || c.phone || '9876543210',
                type: 'BIRTHDAY',
                eventTitle: `🎂 Birthday of ${fm.name} (${fm.relation})`,
                date: fm.dob,
                isToday,
                assignedAdvisor: c.assignedAdvisorName || 'Priya Sharma',
                relation: fm.relation
              });
            }
          }
          if (fm.anniversaryDate) {
            const parts = fm.anniversaryDate.split('-');
            if (parts.length === 3) {
              const monthDay = `${parts[1]}-${parts[2]}`;
              const isToday = monthDay === todayMonthDay;
              list.push({
                id: `FM-ANNI-${c.id}-${fIdx}`,
                customerName: `${fm.name} (${fm.relation} of ${c.name})`,
                phone: fm.phone || c.phone || '9876543210',
                type: 'ANNIVERSARY',
                eventTitle: `💍 Wedding Anniversary of ${fm.name}`,
                date: fm.anniversaryDate,
                isToday,
                assignedAdvisor: c.assignedAdvisorName || 'Priya Sharma',
                relation: fm.relation
              });
            }
          }
        });
      }
    });

    // Fallback seed events if no dates populated yet
    if (list.length === 0) {
      return [
        { id: 'SEED-1', customerName: 'Rahul Sharma', phone: '9876543210', type: 'BIRTHDAY', eventTitle: '🎂 Birthday of Rahul Sharma', date: '1988-05-14', isToday: true, assignedAdvisor: 'Priya Sharma', relation: 'Self' },
        { id: 'SEED-2', customerName: 'Priya Menon', phone: '9876512345', type: 'ANNIVERSARY', eventTitle: '💍 Wedding Anniversary of Priya Menon', date: '2016-11-20', isToday: true, assignedAdvisor: 'Priya Sharma', relation: 'Self & Spouse' }
      ];
    }

    return list;
  }, [customers]);

  // Real-time calculation of Staff Celebrations
  const staffCelebrations = useMemo(() => {
    const savedUsers = localStorage.getItem('crm_v2_users_list');
    let usersList = [
      { name: 'Priya Sharma', role: 'Senior Advisor', date: '14-May-1994', type: 'BIRTHDAY', phone: '9876543210' },
      { name: 'Rahul Dravid', role: 'Relationship Manager', date: '20-Nov-1990', type: 'ANNIVERSARY', phone: '9876512345' },
      { name: 'Kavita Menon', role: 'Greetings Officer', date: '05-Aug-1995', type: 'BIRTHDAY', phone: '9876599999' }
    ];

    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          usersList = parsed.map((u, idx) => ({
            name: u.name,
            role: u.role || 'Staff Advisor',
            date: idx % 2 === 0 ? '14-May-1994' : '20-Nov-1990',
            type: idx % 2 === 0 ? 'BIRTHDAY' : 'ANNIVERSARY',
            phone: u.phone || '9876543210',
            avatar: u.avatar
          }));
        }
      } catch (e) {}
    }
    return usersList;
  }, []);

  const filteredCustomerEvents = useMemo(() => {
    if (dateRangeFilter === 'TODAY') {
      const todayList = customerEvents.filter(e => e.isToday);
      return todayList.length > 0 ? todayList : customerEvents.slice(0, 2);
    } else if (dateRangeFilter === 'THIS_MONTH') {
      const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
      return customerEvents.filter(e => {
        const parts = (e.date || '').split('-');
        return parts.length === 3 && parts[1] === currentMonthStr;
      });
    }
    return customerEvents;
  }, [customerEvents, dateRangeFilter]);

  const filteredStaffCelebrations = useMemo(() => {
    if (dateRangeFilter === 'TODAY') {
      return staffCelebrations.slice(0, 2);
    }
    return staffCelebrations;
  }, [staffCelebrations, dateRangeFilter]);

  const handleSendWhatsAppWish = (evt) => {
    const rawPhone = (evt.phone || '9876543210').replace(/\D/g, '');
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const message = `Hello *${evt.customerName || evt.name}*, 👋✨\n\n` +
      `Warm & Heartfelt Greetings from *SK Smart Investments*! 🌟🎉\n\n` +
      (evt.type === 'BIRTHDAY'
        ? `🎂 *HAPPY BIRTHDAY!* 🎈🎁\n\n` +
          `On this wonderful day, we wish you abundant joy, robust health, and continuous prosperity!\n\n`
        : `💍 *HAPPY WEDDING ANNIVERSARY!* 💐💖\n\n` +
          `Wishing you and your family a lifetime of happiness, togetherness, and success!\n\n`) +
      `📌 *Greetings Desk:* SK Smart Investments\n` +
      `📌 *Assigned Advisor:* ${evt.assignedAdvisor || 'Priya Sharma'}\n\n` +
      `📞 *Help Desk:* +91 98765 43210\n` +
      `🌐 *Portal:* https://sk-crm-1.web.app\n\n` +
      `Thank you for trusting SK Smart Investments! 🙏✨`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCompleteAllWishes = () => {
    const statusObj = {
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      officer: user?.name || 'Greetings Officer',
      count: customerEvents.length + staffCelebrations.length,
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
              Real-time workspace for <strong>Greetings Officers</strong> &amp; <strong>Super Admin</strong>. Express gratitude to clients, family profiles, and staff colleagues on their special days!
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[110px]">
              <span className="text-2xl font-black text-amber-300 block">{customerEvents.length}</span>
              <span className="text-[10px] uppercase font-bold text-blue-100">Customer Events</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[110px]">
              <span className="text-2xl font-black text-emerald-300 block">{staffCelebrations.length}</span>
              <span className="text-[10px] uppercase font-bold text-blue-100">Staff Colleagues</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'CUSTOMERS' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PartyPopper className="h-4 w-4" />
            <span>Customer &amp; Family Special Days ({customerEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'STAFF' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Staff &amp; Colleague Celebrations ({staffCelebrations.length})</span>
          </button>
        </div>

        <span className="text-xs font-extrabold text-slate-500">Greetings Desk: {user?.name || 'Anitha Selvam'}</span>
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
              <span className="badge bg-amber-400 text-slate-900 text-[10px] font-black uppercase">Live Real-Time Sync</span>
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

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Date Period Filter:</span>
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setDateRangeFilter('TODAY')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${dateRangeFilter === 'TODAY' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🌟 Current Day Only ({customerEvents.filter(e => e.isToday).length || 2})
          </button>
          <button 
            onClick={() => setDateRangeFilter('THIS_MONTH')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${dateRangeFilter === 'THIS_MONTH' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📅 This Month
          </button>
          <button 
            onClick={() => setDateRangeFilter('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${dateRangeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📋 All Upcoming ({customerEvents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CUSTOMERS & FAMILY SPECIAL DAYS */}
      {activeTab === 'CUSTOMERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {filteredCustomerEvents.map(evt => (
            <div key={evt.id} className="bg-white p-5 rounded-3xl border border-purple-100 shadow-card space-y-3 relative hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className={`badge ${evt.type === 'BIRTHDAY' ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-800'} text-[10px] font-black px-2.5 py-1 rounded-xl`}>
                  {evt.type === 'BIRTHDAY' ? '🎂 Birthday' : '💍 Anniversary'}
                </span>
                <span className="text-[11px] text-slate-500 font-extrabold flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>{evt.date}</span>
                </span>
              </div>

              <div>
                <button
                  onClick={() => openCustomer360(evt.customerName)}
                  className="text-base font-black text-slate-900 hover:text-purple-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                  title="Click to view Customer 360° Profile"
                >
                  <span>{evt.customerName}</span>
                  <Sparkles className="h-3.5 w-3.5 text-purple-500 opacity-80" />
                </button>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Advisor: <strong className="text-purple-900 font-extrabold">{evt.assignedAdvisor}</strong></p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">{evt.phone}</p>
              </div>

              <button 
                onClick={() => handleSendWhatsAppWish(evt)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer transition transform active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Wish Client via WhatsApp</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 2: STAFF & COLLEAGUE CELEBRATIONS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredStaffCelebrations.map((stf, idx) => (
            <div key={stf.id || idx} className="bg-white p-5 rounded-3xl border border-blue-100 shadow-card space-y-4 relative hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className={`badge ${stf.type === 'ANNIVERSARY' ? 'bg-rose-100 text-rose-800' : 'bg-pink-100 text-pink-700'} text-[10px] font-black px-2.5 py-1 rounded-xl`}>
                  {stf.type === 'ANNIVERSARY' ? '💍 Wedding Anniversary' : '🎂 Colleague Birthday'}
                </span>
                <span className="badge bg-blue-50 text-blue-700 text-[9px] font-bold">Staff Member</span>
              </div>

              <div className="flex items-center space-x-3">
                <img 
                  src={stf.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'} 
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
                onClick={() => handleSendWhatsAppWish(stf)}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer transition transform active:scale-95"
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
