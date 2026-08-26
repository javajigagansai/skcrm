import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { 
  PartyPopper, Send, Cake, Heart, UserCheck, Calendar, Phone
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

// Check if an event date matches a calendar period (Today, This Week, This Month, All)
const isEventInPeriod = (eventDateStr, period) => {
  if (!eventDateStr || period === 'ALL') return true;
  
  let eventMonth = -1;
  let eventDay = -1;

  if (typeof eventDateStr === 'string' && eventDateStr.includes('-')) {
    const parts = eventDateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        eventMonth = parseInt(parts[1], 10) - 1;
        eventDay = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY or DD-Mon-YYYY
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const mIdx = monthNames.indexOf(parts[1].toLowerCase());
        if (mIdx !== -1) {
          eventMonth = mIdx;
        } else {
          eventMonth = parseInt(parts[1], 10) - 1;
        }
        eventDay = parseInt(parts[0], 10);
      }
    }
  }

  if (eventMonth === -1 || eventDay === -1) return true;

  const now = new Date();
  const currentYear = now.getFullYear();
  const eventThisYear = new Date(currentYear, eventMonth, eventDay);

  if (period === 'TODAY') {
    return now.getMonth() === eventMonth && now.getDate() === eventDay;
  }

  if (period === 'THIS_MONTH') {
    return now.getMonth() === eventMonth;
  }

  if (period === 'THIS_WEEK') {
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(currentYear, now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const sun = new Date(currentYear, now.getMonth(), now.getDate() + diffToMonday + 6, 23, 59, 59, 999);
    return eventThisYear >= mon && eventThisYear <= sun;
  }

  return true;
};

export const SpecialDays = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { customers } = useData();

  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // 'CUSTOMERS' | 'STAFF'
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL'); // 'ALL' | 'BIRTHDAY' | 'ANNIVERSARY'
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'

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
            assignedAdvisor: c.assignedAdvisorName || c.assignedStaff || 'Unassigned',
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
            phone: c.phone || '',
            type: 'ANNIVERSARY',
            eventTitle: `💍 Wedding Anniversary of ${c.name}`,
            date: c.anniversaryDate,
            isToday,
            assignedAdvisor: c.assignedAdvisorName || c.assignedStaff || 'Unassigned',
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
                phone: fm.phone || c.phone || '',
                type: 'BIRTHDAY',
                eventTitle: `🎂 Birthday of ${fm.name} (${fm.relation})`,
                date: fm.dob,
                isToday,
                assignedAdvisor: c.assignedAdvisorName || c.assignedStaff || 'Unassigned',
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
                phone: fm.phone || c.phone || '',
                type: 'ANNIVERSARY',
                eventTitle: `💍 Wedding Anniversary of ${fm.name}`,
                date: fm.anniversaryDate,
                isToday,
                assignedAdvisor: c.assignedAdvisorName || c.assignedStaff || 'Unassigned',
                relation: fm.relation
              });
            }
          }
        });
      }
    });

    return list;
  }, [customers]);

  // Real-time calculation of Staff Celebrations
  const staffCelebrations = useMemo(() => {
    const savedUsers = localStorage.getItem('crm_v2_users_list');
    let usersList = [];

    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          usersList = parsed.filter(u => u.dob || u.anniversaryDate).map((u) => ({
            name: u.name,
            role: u.role || 'Staff Advisor',
            date: u.dob || u.anniversaryDate,
            type: u.dob ? 'BIRTHDAY' : 'ANNIVERSARY',
            phone: u.phone || '',
            avatar: u.avatar
          }));
        }
      } catch (e) {}
    }
    return usersList;
  }, []);

  const filteredCustomerEvents = useMemo(() => {
    return customerEvents.filter(evt => {
      if (eventTypeFilter !== 'ALL' && evt.type !== eventTypeFilter) return false;
      return isEventInPeriod(evt.date, timeFilter);
    }).sort((a, b) => (b.isToday ? 1 : 0) - (a.isToday ? 1 : 0));
  }, [customerEvents, eventTypeFilter, timeFilter]);

  const filteredStaffCelebrations = useMemo(() => {
    return staffCelebrations.filter(stf => {
      if (eventTypeFilter !== 'ALL' && stf.type !== eventTypeFilter) return false;
      return isEventInPeriod(stf.date, timeFilter);
    });
  }, [staffCelebrations, eventTypeFilter, timeFilter]);

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
      `📌 *Assigned Advisor:* ${evt.assignedAdvisor || 'Senior Advisor'}\n\n` +
      `📞 *Help Desk:* +91 98765 43210\n` +
      `🌐 *Portal:* https://sk-crm-1.web.app\n\n` +
      `Thank you for trusting SK Smart Investments! 🙏✨`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-5">

      {/* Navigation Tab Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'CUSTOMERS' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PartyPopper className="h-4 w-4 text-amber-400" />
            <span>Customer &amp; Family Special Days</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'CUSTOMERS' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {filteredCustomerEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'STAFF' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="h-4 w-4 text-blue-400" />
            <span>Staff &amp; Colleague Celebrations</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'STAFF' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {filteredStaffCelebrations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Professional Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Event Type Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-100/90 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setEventTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              eventTypeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            All Celebrations
          </button>
          <button
            type="button"
            onClick={() => setEventTypeFilter('BIRTHDAY')}
            className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 ${
              eventTypeFilter === 'BIRTHDAY'
                ? 'bg-pink-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>Birthdays</span>
          </button>
          <button
            type="button"
            onClick={() => setEventTypeFilter('ANNIVERSARY')}
            className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 ${
              eventTypeFilter === 'ANNIVERSARY'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Anniversaries</span>
          </button>
        </div>

        {/* Right: Date Period Presets */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Period:
          </span>
          {[
            { key: 'TODAY', label: 'Today' },
            { key: 'THIS_WEEK', label: 'Weekly' },
            { key: 'THIS_MONTH', label: 'Monthly' },
            { key: 'ALL', label: 'All' },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setTimeFilter(preset.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[32px] flex items-center justify-center ${
                timeFilter === preset.key
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CUSTOMERS & FAMILY SPECIAL DAYS */}
      {activeTab === 'CUSTOMERS' ? (
        filteredCustomerEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <Cake className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No celebrations found</p>
            <p className="text-xs text-slate-400">There are no customer special days matching the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredCustomerEvents.map(evt => {
              const isBday = evt.type === 'BIRTHDAY';
              const displayDate = formatDateDisplay(evt.date);
              const initials = getInitials(evt.customerName);

              return (
                <div 
                  key={evt.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  {/* Header Box */}
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                    isBday ? 'bg-pink-50/70 border-pink-100' : 'bg-amber-50/70 border-amber-100'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      {isBday ? (
                        <Cake className="w-4 h-4 text-pink-600" />
                      ) : (
                        <Heart className="w-4 h-4 text-amber-600 fill-amber-500" />
                      )}
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        isBday ? 'text-pink-800' : 'text-amber-800'
                      }`}>
                        {isBday ? 'Birthday' : 'Anniversary'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{displayDate}</span>
                    </div>
                  </div>

                  {/* Profile & Data Boxes */}
                  <div className="p-4 space-y-3">
                    {/* Person Details Row */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 text-white shadow-2xs ${
                        isBday ? 'bg-pink-600' : 'bg-amber-600'
                      }`}>
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openCustomer360(evt.customerName)}
                          className="font-black text-slate-900 hover:text-blue-600 transition truncate text-sm block text-left w-full cursor-pointer"
                          title="View Customer 360° Profile"
                        >
                          {evt.customerName}
                        </button>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Relation: <span className="text-slate-800 font-bold">{evt.relation || 'Self'}</span>
                        </p>
                      </div>
                    </div>

                    {/* 2-Column Info Boxes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Advisor
                        </span>
                        <span className="font-bold text-slate-800 truncate block" title={evt.assignedAdvisor}>
                          {evt.assignedAdvisor || 'Senior Advisor'}
                        </span>
                      </div>

                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Contact
                        </span>
                        <a 
                          href={`tel:${evt.phone || '9876543210'}`} 
                          className="font-mono font-bold text-slate-800 hover:text-blue-600 truncate block"
                        >
                          {evt.phone || '9876543210'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action Box Footer */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppWish(evt)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Wish via WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TAB 2: STAFF & COLLEAGUE CELEBRATIONS */
        filteredStaffCelebrations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No celebrations found</p>
            <p className="text-xs text-slate-400">There are no staff celebrations matching the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredStaffCelebrations.map((stf, idx) => {
              const isBday = stf.type === 'BIRTHDAY';
              const displayDate = formatDateDisplay(stf.date);
              const initials = getInitials(stf.name);

              return (
                <div 
                  key={stf.id || idx} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  {/* Header Box */}
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                    isBday ? 'bg-blue-50/70 border-blue-100' : 'bg-purple-50/70 border-purple-100'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      {isBday ? (
                        <Cake className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Heart className="w-4 h-4 text-purple-600 fill-purple-500" />
                      )}
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        isBday ? 'text-blue-800' : 'text-purple-800'
                      }`}>
                        {isBday ? 'Birthday' : 'Anniversary'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{displayDate}</span>
                    </div>
                  </div>

                  {/* Profile & Data Boxes */}
                  <div className="p-4 space-y-3">
                    {/* Person Details Row */}
                    <div className="flex items-center space-x-3">
                      {stf.avatar ? (
                        <img 
                          src={stf.avatar} 
                          alt={stf.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 text-white shadow-2xs ${
                          isBday ? 'bg-blue-600' : 'bg-purple-600'
                        }`}>
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-900 truncate text-sm">
                          {stf.name || 'Team Colleague'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Team: <span className="text-slate-800 font-bold">{stf.role || 'Staff Advisor'}</span>
                        </p>
                      </div>
                    </div>

                    {/* 2-Column Info Boxes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Role
                        </span>
                        <span className="font-bold text-slate-800 truncate block" title={stf.role}>
                          {stf.role || 'Staff Advisor'}
                        </span>
                      </div>

                      <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Contact
                        </span>
                        <a 
                          href={`tel:${stf.phone || '9876543210'}`} 
                          className="font-mono font-bold text-slate-800 hover:text-blue-600 truncate block"
                        >
                          {stf.phone || '9876543210'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action Box Footer */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppWish(stf)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Wish Colleague via WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
