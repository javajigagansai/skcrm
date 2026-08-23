import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { 
  PartyPopper, Sparkles, Send, Cake, Heart, PhoneCall, Mail, UserCheck, Users, 
  ShieldCheck, Calendar, Phone, ArrowUpRight, ExternalLink, MessageCircle
} from 'lucide-react';

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'Today';
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
  }
  return dateStr;
};

const getInitials = (name) => {
  if (!name) return 'C';
  const clean = name.replace(/\(.*?\)/g, '').trim();
  const words = clean.split(' ').filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return clean.substring(0, 2).toUpperCase();
};

export const SpecialDays = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { customers } = useData();

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS' | 'STAFF'

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
    return [...customerEvents].sort((a, b) => (b.isToday ? 1 : 0) - (a.isToday ? 1 : 0));
  }, [customerEvents]);

  const filteredStaffCelebrations = useMemo(() => {
    return staffCelebrations;
  }, [staffCelebrations]);

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

  return (
    <div className="space-y-6">

      {/* Navigation Tab Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'CUSTOMERS' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PartyPopper className="h-4 w-4" />
            <span>Customer &amp; Family Special Days</span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'STAFF' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Staff &amp; Colleague Celebrations</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 pr-3 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{activeTab === 'CUSTOMERS' ? `${filteredCustomerEvents.length} Special Celebrations` : `${filteredStaffCelebrations.length} Staff Celebrations`}</span>
        </div>
      </div>

      {/* TAB 1: CUSTOMERS & FAMILY SPECIAL DAYS */}
      {activeTab === 'CUSTOMERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {filteredCustomerEvents.map(evt => {
            const isBday = evt.type === 'BIRTHDAY';
            const displayDate = formatDateDisplay(evt.date);
            const initials = getInitials(evt.customerName);

            return (
              <div 
                key={evt.id} 
                className={`rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border ${
                  isBday 
                    ? 'bg-gradient-to-b from-pink-50/50 via-white to-white border-pink-100/80 hover:border-pink-300 shadow-sm' 
                    : 'bg-gradient-to-b from-amber-50/50 via-white to-white border-amber-100/80 hover:border-amber-300 shadow-sm'
                }`}
              >
                {/* Decorative Celebration Glow Watermark in background */}
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none select-none">
                  {isBday ? <Cake className="w-32 h-32 text-pink-600" /> : <Heart className="w-32 h-32 text-amber-600" />}
                </div>

                {/* Header Badge & Formatted Date */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs border ${
                    isBday 
                      ? 'bg-pink-100/90 text-pink-700 border-pink-200' 
                      : 'bg-amber-100/90 text-amber-800 border-amber-200'
                  }`}>
                    {isBday ? (
                      <>
                        <Cake className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span>Birthday</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                        <span>Anniversary</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-1.5 bg-slate-100/90 px-3 py-1 rounded-xl text-xs font-black text-slate-700 border border-slate-200/70">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{displayDate}</span>
                  </div>
                </div>

                {/* Customer Avatar & Name Info */}
                <div className="flex items-start space-x-3.5 mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 border-2 border-white ${
                    isBday
                      ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600'
                      : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => openCustomer360(evt.customerName)}
                      className="text-base font-black text-slate-900 hover:text-purple-600 transition cursor-pointer text-left flex items-center space-x-1.5 group truncate w-full"
                      title="Click to view Customer 360° Profile"
                    >
                      <span className="truncate">{evt.customerName}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-purple-600 shrink-0" />
                    </button>
                    
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Relation: <strong className="text-slate-700">{evt.relation || 'Self'}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured Details Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 relative z-10">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-purple-500 shrink-0" />
                      <span>Advisor</span>
                    </span>
                    <p className="text-xs font-black text-slate-800 truncate" title={evt.assignedAdvisor}>
                      {evt.assignedAdvisor || 'Priya Sharma'}
                    </p>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Contact</span>
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate">
                      {evt.phone || '9876543210'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center space-x-2 relative z-10">
                  <button 
                    onClick={() => handleSendWhatsAppWish(evt)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-md hover:shadow-emerald-200/50 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Wish via WhatsApp</span>
                  </button>

                  <a 
                    href={`tel:${evt.phone || '9876543210'}`}
                    className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Direct Phone Call"
                  >
                    <PhoneCall className="h-4 w-4 text-slate-700" />
                  </a>

                  <button 
                    onClick={() => openCustomer360(evt.customerName)}
                    className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 border border-purple-200 transition cursor-pointer flex items-center justify-center shrink-0"
                    title="View Customer 360°"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TAB 2: STAFF & COLLEAGUE CELEBRATIONS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {filteredStaffCelebrations.map((stf, idx) => {
            const isBday = stf.type === 'BIRTHDAY';
            const displayDate = formatDateDisplay(stf.date);
            const initials = getInitials(stf.name);

            return (
              <div 
                key={stf.id || idx} 
                className={`rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border ${
                  isBday 
                    ? 'bg-gradient-to-b from-blue-50/50 via-white to-white border-blue-100/80 hover:border-blue-300 shadow-sm' 
                    : 'bg-gradient-to-b from-purple-50/50 via-white to-white border-purple-100/80 hover:border-purple-300 shadow-sm'
                }`}
              >
                {/* Decorative Watermark */}
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none select-none">
                  {isBday ? <Cake className="w-32 h-32 text-blue-600" /> : <Heart className="w-32 h-32 text-purple-600" />}
                </div>

                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs border ${
                    isBday 
                      ? 'bg-blue-100/90 text-blue-700 border-blue-200' 
                      : 'bg-purple-100/90 text-purple-800 border-purple-200'
                  }`}>
                    {isBday ? (
                      <>
                        <Cake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Colleague Birthday</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5 text-purple-600 fill-purple-500 shrink-0" />
                        <span>Wedding Anniversary</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-1.5 bg-slate-100/90 px-3 py-1 rounded-xl text-xs font-black text-slate-700 border border-slate-200/70">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{displayDate}</span>
                  </div>
                </div>

                {/* Staff Avatar & Details */}
                <div className="flex items-start space-x-3.5 mb-4 relative z-10">
                  {stf.avatar ? (
                    <img 
                      src={stf.avatar} 
                      alt={stf.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 border-2 border-white">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-slate-900 truncate">{stf.name || 'Team Colleague'}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span>Team: <strong className="text-slate-700">{stf.role || 'Staff Advisor'}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured Details Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 relative z-10">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Role</span>
                    </span>
                    <p className="text-xs font-black text-slate-800 truncate" title={stf.role}>
                      {stf.role || 'Staff Advisor'}
                    </p>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>Contact</span>
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate">
                      {stf.phone || '9876543210'}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center space-x-2 relative z-10">
                  <button 
                    onClick={() => handleSendWhatsAppWish(stf)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Wish Colleague via WhatsApp</span>
                  </button>

                  <a 
                    href={`tel:${stf.phone || '9876543210'}`}
                    className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Direct Phone Call"
                  >
                    <PhoneCall className="h-4 w-4 text-slate-700" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
