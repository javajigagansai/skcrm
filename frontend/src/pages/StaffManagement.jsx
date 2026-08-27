import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../config/firebaseClient';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  Users, UserCheck, UserPlus, Award, TrendingUp, Search, Filter, Plus, Edit, Key,
  Trash2, X, Eye, EyeOff, ShieldCheck, CheckCircle2, ChevronRight, Phone,
  Mail, Building2, Briefcase, FileText, Target, Sparkles, AlertCircle, ArrowUpRight
} from 'lucide-react';

const INITIAL_STAFF_SEED = [
  { uid: 'UID-STF-1001', name: 'Prakash Gajendiran', email: 'admin@sk-smart-investments.com', role: 'SUPER_ADMIN', title: 'Super Admin / Executive Director', phone: '9876543210', branch: 'Chennai Main HQ Desk', status: 'ACTIVE', fixedSalary: 0, monthlyTarget: 0, achievedRevenue: 0, assignedClientsCount: 0, policiesIssuedCount: 0, commissionEarned: 0, password: 'Password@123', joinDate: '2023-01-01' },
  { uid: 'UID-STF-1002', name: 'Branch Manager', email: 'manager@sk-smart-investments.com', role: 'MANAGER', title: 'Regional Operations Manager', phone: '9812345678', branch: 'Bangalore Regional Desk', status: 'ACTIVE', fixedSalary: 0, monthlyTarget: 0, achievedRevenue: 0, assignedClientsCount: 0, policiesIssuedCount: 0, commissionEarned: 0, password: 'Password@123', joinDate: '2023-11-01' },
];

export const StaffManagement = () => {
  const { user: activeUser } = useAuth();
  const { customers, policies, followups } = useData();
  const isAdminOrHigher = activeUser?.role === 'SUPER_ADMIN' || activeUser?.role === 'ADMIN' || activeUser?.role === 'MANAGER' || !activeUser?.role;

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map(u => ({
            ...u,
            achievedRevenue: 0,
            assignedClientsCount: 0,
            policiesIssuedCount: 0,
            commissionEarned: 0
          })).filter(u =>
            !['Rahul Dravid', 'Kavita Menon', 'Greetings Officer', 'Anitha Selvam', 'Karthik Subramanian'].includes(u.name) &&
            !['rahul.d@sksmart.com', 'kavita.m@sksmart.com', 'wishes@sksmart.com', 'anitha.s@sksmart.com', 'karthik.s@sksmart.com'].includes(u.email)
          );
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) { }
    }
    return INITIAL_STAFF_SEED;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff360, setSelectedStaff360] = useState(null);
  const [active360Tab, setActive360Tab] = useState('OVERVIEW');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditTargetModal, setShowEditTargetModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [targetStaff, setTargetStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  const [editStaffForm, setEditStaffForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    title: 'Staff Advisor',
    phone: '',
    branch: 'Chennai Main Head Office',
    fixedSalary: 270000,
    monthlyTarget: 400000
  });

  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    title: 'Staff Advisor',
    phone: '',
    branch: 'Chennai Main Head Office',
    fixedSalary: 250000,
    monthlyTarget: 400000,
    password: 'Password@123'
  });

  // Real-time synchronization from Firestore users collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const remote = [];
      snap.forEach(docSnap => {
        remote.push({ uid: docSnap.id, ...docSnap.data() });
      });
      if (remote.length > 0) {
        setStaffList(remote);
        try {
          localStorage.setItem('crm_v2_users_list', JSON.stringify(remote));
        } catch (e) {}
      }
    }, (err) => console.warn("Staff live sync warning:", err.message));

    return () => unsub();
  }, []);

  // Keep local storage synced
  useEffect(() => {
    try {
      localStorage.setItem('crm_v2_users_list', JSON.stringify(staffList));
      window.dispatchEvent(new Event('storage_users_updated'));
    } catch (e) { }
  }, [staffList]);

  // Listen to storage_users_updated event for instant synchronization from User Management
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('crm_v2_users_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStaffList(parsed);
          }
        }
      } catch (e) { }
    };
    window.addEventListener('storage_users_updated', handleStorageUpdate);
    return () => window.removeEventListener('storage_users_updated', handleStorageUpdate);
  }, []);

  const togglePasswordVisibility = (uid) => {
    setShowPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.email) {
      alert('Please fill in Staff Name and Email');
      return;
    }

    const createdMember = {
      uid: 'UID-STF-' + Math.floor(1000 + Math.random() * 9000),
      ...newStaffForm,
      status: 'ACTIVE',
      achievedRevenue: 0,
      assignedClientsCount: 0,
      policiesIssuedCount: 0,
      commissionEarned: 0,
      joinDate: new Date().toISOString().split('T')[0]
    };

    const updatedList = [createdMember, ...staffList];
    setStaffList(updatedList);

    // Save permanently to LocalStorage & Firestore users collection
    try {
      localStorage.setItem('crm_v2_users_list', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage_users_updated'));
      setDoc(doc(db, 'users', createdMember.uid), createdMember, { merge: true }).catch(() => { });
    } catch (e) { }

    setShowAddStaffModal(false);
    setNewStaffForm({
      name: '',
      email: '',
      role: 'EMPLOYEE',
      title: 'Staff Advisor',
      phone: '',
      branch: 'Chennai Main Head Office',
      monthlyTarget: 400000,
      password: 'Password@123'
    });
    alert(`Staff Member "${createdMember.name}" created successfully!`);
  };

  const handleOpenEditStaff = (st) => {
    setEditingStaff(st);
    setEditStaffForm({
      name: st.name || '',
      email: st.email || '',
      role: st.role || 'EMPLOYEE',
      title: st.title || 'Staff Advisor',
      phone: st.phone || '',
      branch: st.branch || 'Chennai Main Head Office',
      fixedSalary: st.fixedSalary !== undefined ? st.fixedSalary : 270000,
      monthlyTarget: st.monthlyTarget || 400000
    });
    setShowEditStaffModal(true);
  };

  const handleUpdateStaff = (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    const updatedList = staffList.map(s => {
      if (s.uid === editingStaff.uid) {
        return {
          ...s,
          name: editStaffForm.name,
          email: editStaffForm.email,
          role: editStaffForm.role,
          title: editStaffForm.title,
          phone: editStaffForm.phone,
          branch: editStaffForm.branch,
          fixedSalary: Number(editStaffForm.fixedSalary) || 0,
          monthlyTarget: Number(editStaffForm.monthlyTarget) || 0
        };
      }
      return s;
    });

    setStaffList(updatedList);

    if (selectedStaff360 && selectedStaff360.uid === editingStaff.uid) {
      setSelectedStaff360(prev => ({
        ...prev,
        name: editStaffForm.name,
        email: editStaffForm.email,
        role: editStaffForm.role,
        title: editStaffForm.title,
        phone: editStaffForm.phone,
        branch: editStaffForm.branch,
        fixedSalary: Number(editStaffForm.fixedSalary) || 0,
        monthlyTarget: Number(editStaffForm.monthlyTarget) || 0
      }));
    }

    try {
      localStorage.setItem('crm_v2_users_list', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage_users_updated'));
      setDoc(doc(db, 'users', editingStaff.uid), {
        name: editStaffForm.name,
        email: editStaffForm.email,
        role: editStaffForm.role,
        title: editStaffForm.title,
        phone: editStaffForm.phone,
        branch: editStaffForm.branch,
        fixedSalary: Number(editStaffForm.fixedSalary) || 0,
        monthlyTarget: Number(editStaffForm.monthlyTarget) || 0
      }, { merge: true }).catch(() => { });
    } catch (err) { }

    setShowEditStaffModal(false);
    setEditingStaff(null);
    alert(`Staff Member "${editStaffForm.name}" details and fixed salary updated successfully!`);
  };

  const handleUpdateTarget = (e) => {
    e.preventDefault();
    if (!targetStaff || !newTargetAmount) return;

    setStaffList(prev => prev.map(s => s.uid === targetStaff.uid ? { ...s, monthlyTarget: Number(newTargetAmount) } : s));
    if (selectedStaff360 && selectedStaff360.uid === targetStaff.uid) {
      setSelectedStaff360(prev => ({ ...prev, monthlyTarget: Number(newTargetAmount) }));
    }

    setShowEditTargetModal(false);
    setTargetStaff(null);
    setNewTargetAmount('');
    alert('Staff monthly revenue target updated successfully!');
  };

  const handleStatusToggle = (uid, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setStaffList(prev => prev.map(s => s.uid === uid ? { ...s, status: nextStatus } : s));
    if (selectedStaff360 && selectedStaff360.uid === uid) {
      setSelectedStaff360(prev => ({ ...prev, status: nextStatus }));
    }
  };

  const filteredStaff = staffList.filter(st => {
    if (!st) return false;
    const name = st.name || '';
    const email = st.email || '';
    const role = st.role || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStaffAssignedClients = (staffObj) => {
    if (!staffObj) return [];
    const stName = (typeof staffObj === 'string' ? staffObj : staffObj.name || '').toLowerCase().trim();
    const stFirst = stName.split(' ')[0];
    const stEmail = (typeof staffObj === 'object' ? staffObj.email || '' : '').toLowerCase().trim();
    const stUid = typeof staffObj === 'object' ? staffObj.uid : null;

    return (customers || []).filter(c => {
      const cAdvisor = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || '').toLowerCase().trim();
      const cEmail = (c.assignedStaffEmail || c.advisorEmail || '').toLowerCase().trim();
      if (cAdvisor && (cAdvisor === stName || (stFirst && cAdvisor.split(' ')[0] === stFirst))) return true;
      if (cEmail && stEmail && cEmail === stEmail) return true;
      if (stUid && c.staffId && c.staffId === stUid) return true;
      return false;
    });
  };

  const getStaffIssuedPolicies = (staffObj) => {
    if (!staffObj) return [];
    const stName = (typeof staffObj === 'string' ? staffObj : staffObj.name || '').toLowerCase().trim();
    const stFirst = stName.split(' ')[0];
    const stEmail = (typeof staffObj === 'object' ? staffObj.email || '' : '').toLowerCase().trim();

    return (policies || []).filter(p => {
      const pStaff = (p.assignedStaff || p.advisorName || p.staffName || '').toLowerCase().trim();
      const pEmail = (p.assignedStaffEmail || '').toLowerCase().trim();
      if (pStaff && (pStaff === stName || (stFirst && pStaff.split(' ')[0] === stFirst))) return true;
      if (pEmail && stEmail && pEmail === stEmail) return true;
      return false;
    });
  };

  const getStaffLiveMetrics = (st) => {
    if (!st) return { clientsCount: 0, policiesCount: 0, achievedRevenue: 0, commissionEarned: 0 };
    const assignedClients = getStaffAssignedClients(st);
    const issuedPolicies = getStaffIssuedPolicies(st);

    const clientsCount = assignedClients.length;
    const policiesCount = issuedPolicies.length;

    let achievedRevenue = issuedPolicies.reduce((sum, p) => sum + (Number(p.grossPremium) || 0), 0);
    if (achievedRevenue === 0 && st.achievedRevenue) {
      achievedRevenue = Number(st.achievedRevenue) || 0;
    }

    const commissionEarned = Math.round(achievedRevenue * 0.10);

    return {
      clientsCount,
      policiesCount,
      achievedRevenue,
      commissionEarned
    };
  };

  const staffPerformanceChartData = useMemo(() => {
    const listToUse = (filteredStaff && filteredStaff.length > 0 ? filteredStaff : staffList).filter(s => s.status === 'ACTIVE');
    return listToUse.map(st => {
      const metrics = getStaffLiveMetrics(st);
      const targetVal = Number(st.monthlyTarget) || 400000;
      const targetInLakhs = parseFloat((targetVal / 100000).toFixed(2));
      const achievedInLakhs = parseFloat((metrics.achievedRevenue / 100000).toFixed(2));
      const completionPct = Math.min(100, Math.round((metrics.achievedRevenue / targetVal) * 100));

      return {
        name: st.name.split(' ')[0],
        fullName: st.name,
        role: st.title || st.role || 'Staff Advisor',
        branch: st.branch || 'Head Office',
        target: targetInLakhs,
        achieved: achievedInLakhs,
        targetRaw: targetVal,
        achievedRaw: metrics.achievedRevenue,
        policiesCount: metrics.policiesCount,
        clientsCount: metrics.clientsCount,
        commissionEarned: metrics.commissionEarned,
        completionPct
      };
    });
  }, [staffList, filteredStaff, policies, customers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="h-7 w-7 text-blue-600" />
            <span>Staff Management &amp; Individual Staff 360° Portal</span>
          </h1>
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Onboard New Staff Advisor</span>
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase text-slate-500">Total Active Staff</span>
          <p className="text-2xl font-black text-slate-900">{staffList.filter(s => s.status === 'ACTIVE').length}</p>
          <span className="badge badge-green text-[10px]">Active Advisors &amp; Managers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase text-slate-500">Total Employee Salary Spend</span>
          <p className="text-2xl font-black text-rose-600">
            ₹{(staffList.filter(s => s.status === 'ACTIVE').reduce((sum, st) => sum + Number(st.fixedSalary !== undefined ? st.fixedSalary : (st.monthlyTarget ? Math.round(st.monthlyTarget * 0.5) : 250000)), 0) / 100000).toFixed(2)} Lakhs
          </p>
          <span className="badge badge-red text-[10px]">Monthly Staff Payroll Outgo</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase text-slate-500">Total Revenue Generated</span>
          <p className="text-2xl font-black text-emerald-700">₹{((policies || []).reduce((sum, p) => sum + (Number(p.grossPremium) || 0), 0) / 100000).toFixed(2)} Lakhs</p>
          <span className="badge badge-green text-[10px]">Cumulative Business</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase text-slate-500">Avg Target Progress</span>
          <p className="text-2xl font-black text-purple-700">
            {staffList.length > 0 ? (staffList.reduce((acc, st) => {
              const m = getStaffLiveMetrics(st);
              const target = st.monthlyTarget || 400000;
              return acc + Math.min(100, Math.round((m.achievedRevenue / target) * 100));
            }, 0) / staffList.length).toFixed(1) : 0}%
          </p>
          <span className="badge badge-purple text-[10px]">Target Achievement Rate</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by Name, Email, or Role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Staff Grid Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map(st => {
          const metrics = getStaffLiveMetrics(st);
          const target = st.monthlyTarget || 400000;
          const achieved = metrics.achievedRevenue;
          const progressPct = Math.min(100, Math.round((achieved / target) * 100));

          return (
            <div
              key={st.uid}
              className="bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-xl hover:border-blue-300 transition space-y-4 p-5 relative group"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 font-black">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition">{st.name}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">{st.title || 'Staff Advisor'}</p>
                  </div>
                </div>
                <span className={`badge text-[10px] font-black uppercase ${st.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                  {st.status || 'ACTIVE'}
                </span>
              </div>

              {/* Contact Details */}
              <div className="text-xs text-slate-600 space-y-1.5 font-semibold">
                <p className="flex items-center space-x-2 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-800">{st.email}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{st.phone || '9876543210'}</span>
                </p>
              </div>

              {/* Business & Target Meter */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-slate-600 uppercase">Fixed Monthly Salary:</span>
                  <span className="text-rose-600 font-black">₹{Number(st.fixedSalary !== undefined ? st.fixedSalary : 270000).toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-extrabold pt-0.5">
                  <span className="text-slate-600 uppercase">Monthly Target:</span>
                  <span className="text-blue-700 font-black">₹{(target / 100000).toFixed(1)} Lakhs</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressPct >= 90 ? 'bg-emerald-500' : progressPct >= 60 ? 'bg-blue-600' : 'bg-amber-500'}`}
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-extrabold pt-0.5">
                  <span className="text-emerald-700">Achieved: ₹{(achieved / 100000).toFixed(2)} L</span>
                  <span className="text-purple-700">{progressPct}% Completed</span>
                </div>
              </div>

              {/* Staff Summary Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                  <span className="block text-slate-500 font-extrabold">Clients</span>
                  <span className="font-black text-blue-900 text-xs">{metrics.clientsCount}</span>
                </div>
                <div className="bg-purple-50/60 p-2 rounded-xl border border-purple-100">
                  <span className="block text-slate-500 font-extrabold">Policies</span>
                  <span className="font-black text-purple-900 text-xs">{metrics.policiesCount}</span>
                </div>
                <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                  <span className="block text-slate-500 font-extrabold">Commission</span>
                  <span className="font-black text-emerald-900 text-xs">₹{metrics.commissionEarned.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleOpenEditStaff(st)}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-[10px] transition cursor-pointer flex items-center space-x-1"
                  title="Edit staff details and fixed salary"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit Staff</span>
                </button>

                <button
                  onClick={() => {
                    setTargetStaff(st);
                    setNewTargetAmount(st.monthlyTarget || 400000);
                    setShowEditTargetModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-extrabold text-[10px] transition cursor-pointer flex items-center space-x-1"
                >
                  <Target className="h-3 w-3" />
                  <span>Target</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStaff360(st);
                    setActive360Tab('OVERVIEW');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] transition cursor-pointer shadow-xs flex items-center space-x-1"
                >
                  <span>360°</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: INDIVIDUAL STAFF 360° DOSSIER ================= */}
      {selectedStaff360 && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 my-6 animate-fadeIn">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3.5 rounded-2xl bg-blue-600 text-white font-black shadow-md">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-900">{selectedStaff360.name}</h2>
                    <span className="badge badge-brand text-[10px] font-black uppercase">{selectedStaff360.role}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{selectedStaff360.title || 'Staff Advisor'} • Joined {selectedStaff360.joinDate || '2024'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusToggle(selectedStaff360.uid, selectedStaff360.status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${selectedStaff360.status === 'ACTIVE' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white'}`}
                >
                  {selectedStaff360.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                </button>
                <button onClick={() => setSelectedStaff360(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b pb-3 text-xs font-extrabold overflow-x-auto">
              <button
                onClick={() => setActive360Tab('OVERVIEW')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${active360Tab === 'OVERVIEW' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                1. Performance Overview
              </button>
              <button
                onClick={() => setActive360Tab('CLIENTS')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${active360Tab === 'CLIENTS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                2. Assigned Clients
              </button>
              <button
                onClick={() => setActive360Tab('POLICIES')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${active360Tab === 'POLICIES' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                3. Issued Policies
              </button>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & CREDENTIALS */}
            {active360Tab === 'OVERVIEW' && (
              <div className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold uppercase text-slate-800 text-[11px] border-b pb-1.5">Employee Contact Information</h4>
                    <p className="text-slate-700">📧 Email: <strong className="font-mono text-slate-900">{selectedStaff360.email}</strong></p>
                    <p className="text-slate-700">📞 Mobile: <strong>{selectedStaff360.phone || '9876543210'}</strong></p>
                    <p className="text-slate-700">🆔 System UID: <span className="font-mono text-slate-500">{selectedStaff360.uid}</span></p>
                  </div>

                  {/* Password & Credentials */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold uppercase text-slate-800 text-[11px] border-b pb-1.5">Credentials &amp; Security</h4>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600">Login Password:</span>
                      <span className="font-mono font-black text-emerald-700 text-xs">
                        {showPasswords[selectedStaff360.uid] ? selectedStaff360.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(selectedStaff360.uid)}
                        className="text-slate-500 hover:text-blue-600 p-1"
                      >
                        {showPasswords[selectedStaff360.uid] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-2">System Status: <span className="badge badge-green text-[10px] font-black">{selectedStaff360.status}</span></p>
                  </div>
                </div>

                {/* Monthly Revenue Target vs Achieved Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-5 rounded-2xl text-white space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <h4 className="font-black text-sm text-amber-300">🎯 Monthly Revenue Performance Meter</h4>
                    <button
                      onClick={() => {
                        setTargetStaff(selectedStaff360);
                        setNewTargetAmount(selectedStaff360.monthlyTarget || 400000);
                        setShowEditTargetModal(true);
                      }}
                      className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] hover:bg-amber-300 transition"
                    >
                      Update Target
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-slate-300 block font-extrabold">Monthly Target</span>
                      <span className="text-lg font-black text-white">₹{((selectedStaff360.monthlyTarget || 400000) / 100000).toFixed(2)} L</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-300 block font-extrabold">Achieved Revenue</span>
                      <span className="text-lg font-black text-emerald-400">₹{(getStaffLiveMetrics(selectedStaff360).achievedRevenue / 100000).toFixed(2)} L</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-300 block font-extrabold">Commission Earned</span>
                      <span className="text-lg font-black text-amber-300">₹{getStaffLiveMetrics(selectedStaff360).commissionEarned.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Performance Bar Chart in 360 Overview Modal */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold uppercase text-slate-800 text-[11px] flex items-center space-x-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span>Target vs Achieved Performance Breakdown</span>
                    </h4>
                    <span className="badge badge-brand text-[10px]">
                      {Math.min(100, Math.round((getStaffLiveMetrics(selectedStaff360).achievedRevenue / (selectedStaff360.monthlyTarget || 400000)) * 100))}% Completed
                    </span>
                  </div>

                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            metric: 'Revenue (₹ Lakhs)',
                            Target: parseFloat(((selectedStaff360.monthlyTarget || 400000) / 100000).toFixed(2)),
                            Achieved: parseFloat((getStaffLiveMetrics(selectedStaff360).achievedRevenue / 100000).toFixed(2))
                          }
                        ]}
                        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: 700 }} />
                        <YAxis unit="L" tick={{ fontSize: 11, fontWeight: 700 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '5px' }} />
                        <Bar dataKey="Target" name="Target (₹ Lakhs)" fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={36} />
                        <Bar dataKey="Achieved" name="Achieved (₹ Lakhs)" fill="#10B981" radius={[6, 6, 0, 0]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: ASSIGNED CLIENTS LIST */}
            {active360Tab === 'CLIENTS' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Clients Assigned to {selectedStaff360.name}</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-900 text-white font-extrabold text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Phone Number</th>
                        <th className="p-3">City</th>
                        <th className="p-3">Marital Status</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getStaffAssignedClients(selectedStaff360).map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                          <td className="p-3 font-mono">{c.phone || c.mobileNumber || '9876543210'}</td>
                          <td className="p-3">{c.city || 'Chennai'}</td>
                          <td className="p-3">{c.maritalStatus || 'Married'}</td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">Active</span></td>
                        </tr>
                      ))}
                      {getStaffAssignedClients(selectedStaff360).length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400">No clients currently assigned to this staff member.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: ISSUED POLICIES */}
            {active360Tab === 'POLICIES' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Insurance &amp; Investment Contracts Issued by {selectedStaff360.name}</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-900 text-white font-extrabold text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Policy ID</th>
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Insurer</th>
                        <th className="p-3">Premium (₹)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getStaffIssuedPolicies(selectedStaff360).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-blue-700">{p.id}</td>
                          <td className="p-3 font-black text-slate-900">{p.customerName}</td>
                          <td className="p-3">{p.insuranceCompany}</td>
                          <td className="p-3 font-mono text-emerald-700 font-bold">₹{p.grossPremium?.toLocaleString()}</td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">{p.status}</span></td>
                        </tr>
                      ))}
                      {getStaffIssuedPolicies(selectedStaff360).length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400">No policies issued by this staff member yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: EDIT MONTHLY TARGET */}
      {showEditTargetModal && targetStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Target className="h-5 w-5 text-amber-600" />
                <span>Set Revenue Target</span>
              </h3>
              <button onClick={() => setShowEditTargetModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleUpdateTarget} className="space-y-4 text-xs font-semibold">
              <p className="text-slate-600">Update monthly target for <strong>{targetStaff.name}</strong>:</p>
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Monthly Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. 500000"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowEditTargetModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md">Update Target</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF DETAILS & FIXED SALARY */}
      {showEditStaffModal && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <span>Edit Staff Member &amp; Salary</span>
              </h3>
              <button onClick={() => setShowEditStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editStaffForm.name}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={editStaffForm.email}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase">Role Designation</label>
                  <select
                    value={editStaffForm.role}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="MANAGER">Branch Manager</option>
                    <option value="EMPLOYEE">Staff Advisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase">Title / Designation</label>
                  <input
                    type="text"
                    value={editStaffForm.title}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, title: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase text-rose-600">
                    Fixed Monthly Salary (₹) {!isAdminOrHigher && <span className="text-[10px] text-slate-400 font-bold">🔒 (Admin Only)</span>}
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!isAdminOrHigher}
                    value={editStaffForm.fixedSalary}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, fixedSalary: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border font-mono font-black outline-none ${isAdminOrHigher ? 'border-rose-300 text-rose-700 bg-rose-50/50 focus:ring-2 focus:ring-rose-500' : 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                    placeholder="e.g. 270000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase">Monthly Target (₹)</label>
                  <input
                    type="number"
                    value={editStaffForm.monthlyTarget}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, monthlyTarget: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. 500000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Phone Number</label>
                <input
                  type="text"
                  value={editStaffForm.phone}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowEditStaffModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md">Save Staff &amp; Salary Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Onboard New Staff Advisor</span>
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase">Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="EMPLOYEE">Staff Advisor</option>
                    <option value="MANAGER">Branch Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-extrabold uppercase text-rose-600">Fixed Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={newStaffForm.fixedSalary}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, fixedSalary: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-rose-300 font-mono font-black text-rose-700 outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
                    placeholder="250000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Phone Number</label>
                <input
                  type="text"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="9876543210"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black shadow-md">Create Staff Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
