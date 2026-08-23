import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  X, UserCheck, Users, ShieldCheck, ShieldAlert, Award, Sparkles, IndianRupee, 
  FileText, Heart, Phone, Mail, MapPin, CreditCard, ChevronRight, 
  Edit3, Download, Plus, CheckCircle2, Trash2, Clock, AlertCircle, Building2
} from 'lucide-react';
import { exportCustomer360PDF } from '../utils/exportUtils';
import { updateCustomerBackend, deleteCustomerBackend } from '../services/apiService';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const Customer360Context = createContext();

export const initialMockCustomersList = [];

/** Load staff list from localStorage (kept in sync by StaffManagement) */
const loadStaffListFromStorage = () => {
  try {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [
    { uid: 'UID-STF-1003', name: 'Priya Sharma', role: 'EMPLOYEE' },
    { uid: 'UID-STF-1004', name: 'Rahul Dravid', role: 'EMPLOYEE' },
    { uid: 'UID-STF-1005', name: 'Kavita Menon', role: 'EMPLOYEE' }
  ];
};

export const Customer360Provider = ({ children }) => {
  const { user } = useAuth();
  const { 
    getCustomerAggregatedDetails, 
    updateCustomer, 
    deleteCustomer,
    claims,
    addClaim,
    updateClaim,
    updateClaimStatus,
    deleteClaim
  } = useData();

  // Staff list — required so the edit modal can write the UID, not just the name
  const [staffList360, setStaffList360] = useState(loadStaffListFromStorage);

  useEffect(() => {
    const sync = () => setStaffList360(loadStaffListFromStorage());
    window.addEventListener('storage_users_updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage_users_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [active360Tab, setActive360Tab] = useState('OVERVIEW');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState(null);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: '',
    relation: 'Spouse',
    gender: 'Female',
    dob: '',
    anniversaryDate: '',
    phone: ''
  });

  // Claims Modal States (Direct Customer 360 <-> Claims Desk Synchronization)
  const [showAddClaimModal, setShowAddClaimModal] = useState(false);
  const [showEditClaimModal, setShowEditClaimModal] = useState(false);
  const [newClaimData, setNewClaimData] = useState({
    policyNo: '',
    insuranceCompany: '',
    claimType: '',
    claimAmount: '',
    settlementAmount: '',
    hospitalOrGarage: '',
    claimDate: new Date().toISOString().split('T')[0],
    assignedStaff: '',
    status: 'SUBMITTED'
  });
  const [editClaimData, setEditClaimData] = useState(null);

  const openCustomer360 = (customerOrName, initialTab = 'OVERVIEW') => {
    if (!customerOrName) return;
    const aggregated = getCustomerAggregatedDetails(customerOrName);
    if (aggregated) {
      setSelectedCustomer(aggregated);
    }
    setActive360Tab(initialTab);
  };

  const closeCustomer360 = () => {
    setSelectedCustomer(null);
    setShowEditModal(false);
    setShowAddFamilyModal(false);
    setShowAddClaimModal(false);
    setShowEditClaimModal(false);
  };

  const handleSaveEditCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomerData || !selectedCustomer) return;

    // --- Permanent Staff Reassignment Fix ---
    // Ensure assignedStaffId is ALWAYS resolved from the staffList before saving.
    // This prevents stale UID from lingering when only the name was changed.
    const resolvedStaff = staffList360.find(
      s => s.uid === editCustomerData.assignedStaffId || s.name === editCustomerData.assignedStaffName || s.name === editCustomerData.assignedAdvisorName
    );
    const finalAssignedStaffId   = resolvedStaff?.uid  || editCustomerData.assignedStaffId  || selectedCustomer.assignedStaffId;
    const finalAssignedStaffName = resolvedStaff?.name || editCustomerData.assignedStaffName || editCustomerData.assignedAdvisorName || selectedCustomer.assignedStaffName;

    const finalData = {
      ...editCustomerData,
      assignedStaffId:   finalAssignedStaffId,
      assignedStaffName: finalAssignedStaffName,
      assignedAdvisorName: finalAssignedStaffName,
      updatedAt: new Date().toISOString()
    };

    // Detect reassignment event for audit trail
    const wasReassigned = finalAssignedStaffId !== selectedCustomer.assignedStaffId;

    if (typeof updateCustomer === 'function') {
      // Pass reassignment flag so DataContext can log it
      updateCustomer(finalData, wasReassigned ? {
        previousStaffId: selectedCustomer.assignedStaffId,
        previousStaffName: selectedCustomer.assignedStaffName,
        newStaffId: finalAssignedStaffId,
        newStaffName: finalAssignedStaffName
      } : null);
    }

    try {
      await updateCustomerBackend(finalData.id || finalData.customerCode, finalData);
    } catch (err) {}

    setSelectedCustomer(prev => ({
      ...prev,
      ...finalData
    }));

    setShowEditModal(false);
    setEditCustomerData(null);

    const msg = wasReassigned
      ? `Customer reassigned from "${selectedCustomer.assignedStaffName}" → "${finalAssignedStaffName}" successfully!`
      : `Customer 360 profile (${finalData.customerCode || finalData.name}) updated successfully across CRM!`;
    alert(msg);
  };

  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    if (!newFamilyMember.name.trim() || !selectedCustomer) return;

    const createdMember = {
      id: `FM-${Date.now()}`,
      name: newFamilyMember.name.trim(),
      relation: newFamilyMember.relation,
      gender: newFamilyMember.gender || (newFamilyMember.relation === 'Spouse' || newFamilyMember.relation === 'Mother' || newFamilyMember.relation === 'Daughter' || newFamilyMember.relation === 'Sister' ? 'Female' : 'Male'),
      dob: newFamilyMember.dob,
      anniversaryDate: newFamilyMember.relation === 'Spouse' ? newFamilyMember.anniversaryDate : '',
      phone: newFamilyMember.phone
    };

    const updatedCust = {
      ...selectedCustomer,
      familyMembers: [...(selectedCustomer.familyMembers || []), createdMember]
    };

    setSelectedCustomer(updatedCust);
    if (typeof updateCustomer === 'function') {
      updateCustomer(updatedCust);
    }
    setShowAddFamilyModal(false);
    setNewFamilyMember({
      name: '',
      relation: 'Spouse',
      gender: 'Female',
      dob: '',
      anniversaryDate: '',
      phone: ''
    });
    alert(`Family Member "${createdMember.name}" added successfully!`);
  };

  const activePoliciesList = selectedCustomer?.policiesList || (selectedCustomer?.insuranceCompany ? [{
    id: selectedCustomer.id || 'POL-REG-01',
    insuranceCompany: selectedCustomer.insuranceCompany,
    type: selectedCustomer.insuranceType || 'Active Policy',
    salesPitch: selectedCustomer.salesPitch || 'Registered Plan',
    grossPremium: selectedCustomer.policyAmount || 0,
    assignedStaff: selectedCustomer.assignedAdvisorName || 'Priya Sharma',
    status: 'ACTIVE'
  }] : []);

  // Reactively derive live claims from shared DataContext so Claims Desk & Customer 360 are always 100% in sync
  const activeClaimsList = useMemo(() => {
    if (!selectedCustomer) return [];
    const effectiveCode = selectedCustomer.customerCode || selectedCustomer.id;
    const effectiveName = selectedCustomer.name;

    const matched = (claims || []).filter(c => {
      const recCode = c.customerCode || c.customerId || c.customer_id;
      if (effectiveCode && recCode) {
        return recCode.toLowerCase().trim() === effectiveCode.toLowerCase().trim();
      }
      return c.customerName && effectiveName && c.customerName.toLowerCase().trim() === effectiveName.toLowerCase().trim();
    });

    if (matched.length > 0) return matched;
    return selectedCustomer.claimsList || selectedCustomer.claims || [];
  }, [claims, selectedCustomer]);

  const activeRenewalsList = selectedCustomer?.renewalsList || [];
  const activeInvestmentsList = selectedCustomer?.investmentsList || selectedCustomer?.activePortfolios || [];
  const activeTasksList = selectedCustomer?.tasksList || [];
  const activeFollowupsList = selectedCustomer?.followupsList || [];

  // Claims Action Handlers
  const handleOpenAddClaim = () => {
    const firstPolicy = activePoliciesList[0];
    setNewClaimData({
      policyNo: firstPolicy?.id || firstPolicy?.policyNo || '',
      insuranceCompany: firstPolicy?.insuranceCompany || '',
      claimType: firstPolicy?.type ? `${firstPolicy.type} Claim` : '',
      claimAmount: '',
      settlementAmount: '',
      hospitalOrGarage: '',
      claimDate: new Date().toISOString().split('T')[0],
      assignedStaff: selectedCustomer?.assignedAdvisorName || selectedCustomer?.assignedStaff || user?.name || '',
      status: 'SUBMITTED'
    });
    setShowAddClaimModal(true);
  };

  const handleSaveAddClaim = async (e) => {
    e.preventDefault();
    if (!newClaimData.claimAmount) {
      alert('Please enter Claim Amount');
      return;
    }
    const claimToSave = {
      ...newClaimData,
      customerId: selectedCustomer.id || selectedCustomer.customerCode,
      customerCode: selectedCustomer.customerCode || selectedCustomer.id,
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone || '',
      claimAmount: parseFloat(newClaimData.claimAmount || 0),
      settlementAmount: parseFloat(newClaimData.settlementAmount || 0),
      assignedStaff: newClaimData.assignedStaff || selectedCustomer.assignedAdvisorName || 'Priya Sharma'
    };
    const created = await addClaim(claimToSave);
    setShowAddClaimModal(false);
    alert(`Claim ${created?.id || 'CLM-NEW'} filed successfully for ${selectedCustomer.name}! Directly updated in Claims Desk.`);
  };

  const handleOpenEditClaim = (clm) => {
    setEditClaimData({
      ...clm,
      claimAmount: clm.claimAmount || clm.amount || '',
      settlementAmount: clm.settlementAmount || '',
      status: clm.status || 'SUBMITTED',
      hospitalOrGarage: clm.hospitalOrGarage || clm.hospital || '',
      assignedStaff: clm.assignedStaff || clm.assignedStaffName || 'Priya Sharma'
    });
    setShowEditClaimModal(true);
  };

  const handleSaveEditClaim = async (e) => {
    e.preventDefault();
    if (!editClaimData || !editClaimData.id) return;
    await updateClaim(editClaimData);
    setShowEditClaimModal(false);
    setEditClaimData(null);
    alert(`Claim ${editClaimData.id} updated successfully! Directly reflected in Claims Desk.`);
  };

  const handleQuickStatusChange = async (claimId, newStatus) => {
    await updateClaimStatus(claimId, newStatus);
  };

  const handleDeleteClaim360 = async (claimId) => {
    if (window.confirm(`Are you sure you want to delete claim ${claimId}? This will remove it from both Customer 360 and Claims Desk.`)) {
      await deleteClaim(claimId);
    }
  };

  return (
    <Customer360Context.Provider value={{ openCustomer360, closeCustomer360, selectedCustomer }}>
      {children}

      {/* GLOBAL CUSTOMER 360 MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          {selectedCustomer.accessDenied ? (
            <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 p-8 text-center space-y-4 animate-fadeIn my-8">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-200">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {selectedCustomer.message || 'You do not have authorization to view this customer portfolio.'}
              </p>
              <button
                onClick={closeCustomer360}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
              >
                Close Profile
              </button>
            </div>
          ) : (
            <div className="bg-white max-w-5xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-[#1E6091] to-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md text-amber-300 font-black flex items-center justify-center text-2xl border border-white/20 shadow-inner">
                  {selectedCustomer.name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-xl font-black tracking-tight">{selectedCustomer.name}</h3>
                    <span className="badge bg-amber-400 text-slate-900 text-[10px] font-black uppercase">
                      Code: {selectedCustomer.customerCode || selectedCustomer.id}
                    </span>
                    <span className={`badge text-[10px] font-extrabold ${selectedCustomer.maritalStatus === 'Married' ? 'bg-pink-500 text-white' : 'bg-purple-600 text-white'}`}>
                      {selectedCustomer.maritalStatus === 'Married' ? '💍 Married' : '👤 Single'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-100 mt-1 flex-wrap">
                    <span>{selectedCustomer.gender || 'Male'}</span>
                    <span>•</span>
                    <span>{selectedCustomer.city || 'Chennai'}</span>
                    <span>•</span>
                    <span>Active Follow-up Staff: <strong className="text-amber-300 font-extrabold">{selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</strong></span>
                  </div>
                </div>
              </div>

              <button 
                onClick={closeCustomer360}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close Window"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">
              <button 
                onClick={() => setActive360Tab('OVERVIEW')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'OVERVIEW' ? 'bg-white text-blue-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Overview &amp; KYC</span>
              </button>

              <button 
                onClick={() => setActive360Tab('FAMILY')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'FAMILY' ? 'bg-white text-pink-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Family Directory ({selectedCustomer.familyMembers?.length || 0})</span>
              </button>

              <button 
                onClick={() => setActive360Tab('POLICIES')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'POLICIES' ? 'bg-white text-emerald-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Insurance Policies ({activePoliciesList.length})</span>
              </button>

              <button 
                onClick={() => setActive360Tab('CLAIMS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'CLAIMS' ? 'bg-white text-amber-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Claims History ({activeClaimsList.length})</span>
              </button>

              <button 
                onClick={() => setActive360Tab('RENEWALS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'RENEWALS' ? 'bg-white text-rose-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Policy Renewals ({activeRenewalsList.length})</span>
              </button>

              <button 
                onClick={() => setActive360Tab('PORTFOLIO')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'PORTFOLIO' ? 'bg-white text-purple-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <IndianRupee className="h-3.5 w-3.5" />
                <span>Holdings &amp; SIPs ({activeInvestmentsList.length})</span>
              </button>

              <button 
                onClick={() => setActive360Tab('TASKS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'TASKS' ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Follow-ups &amp; Notes ({activeTasksList.length + activeFollowupsList.length})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              
              {/* TAB 1: OVERVIEW & PERSONAL INFO */}
              {active360Tab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Present Handling Staff & Active Policy Highlight Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4.5 rounded-2xl border border-purple-200/80 flex items-center space-x-3.5 shadow-xs">
                      <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xs">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Present Handling Staff Officer</span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">{selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</h4>
                        <span className="text-[11px] font-extrabold text-purple-700">Actively Following Up Client</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4.5 rounded-2xl border border-blue-200/80 flex items-center space-x-3.5 shadow-xs">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Present Active Policy &amp; Plan</span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {activePoliciesList[0]?.insuranceCompany ? `${activePoliciesList[0].insuranceCompany} (${activePoliciesList[0].type || 'Active'})` : 'No Policy Attached'}
                        </h4>
                        <span className="text-[11px] font-extrabold text-blue-700">
                          Plan: {activePoliciesList[0]?.type || 'Standard Plan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
                      <span className="text-[10px] font-black uppercase text-blue-600 block">Total Active Policies</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {activePoliciesList.length} Policies
                      </p>
                      <span className="text-[10px] font-extrabold text-blue-700">
                        {activePoliciesList[0]?.insuranceCompany || 'No Policy Attached'}
                      </span>
                    </div>
                    <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                      <span className="text-[10px] font-black uppercase text-amber-600 block">Total Claims Filed</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {activeClaimsList.length} Claims
                      </p>
                      <span className="text-[10px] font-extrabold text-amber-700">
                        {activeClaimsList.length > 0 ? 'Claims Recorded' : 'No Claims Filed'}
                      </span>
                    </div>
                    <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">Active Holdings</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {activeInvestmentsList.length} Portfolios
                      </p>
                      <span className="text-[10px] font-extrabold text-emerald-700">
                        {activeInvestmentsList[0]?.provider || 'No Active Holdings'}
                      </span>
                    </div>
                    <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-black uppercase text-purple-600 block">Assigned Staff</span>
                      <p className="text-sm font-black text-slate-900 mt-1 truncate">
                        {selectedCustomer.assignedAdvisorName || 'Assigned Staff Advisor'}
                      </p>
                      <span className="text-[10px] font-extrabold text-purple-700">Active Follow-up</span>
                    </div>
                  </div>

                  {/* Marital & Special Day Highlight Box */}
                  <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-5 rounded-2xl border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-600">
                        <Heart className="h-6 w-6 fill-pink-500 text-pink-500" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase text-pink-600 tracking-wider">Marital &amp; Relationship Status</span>
                        <h4 className="text-base font-black text-slate-900">
                          {selectedCustomer.maritalStatus === 'Married' ? 'Married Couple 💍' : 'Single Individual 👤'}
                        </h4>
                        {selectedCustomer.maritalStatus === 'Married' && selectedCustomer.anniversaryDate && (
                          <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center space-x-1">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            <span>Wedding Anniversary: <strong>{selectedCustomer.anniversaryDate}</strong></span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setEditCustomerData(selectedCustomer);
                        setShowEditModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-pink-100 text-pink-700 font-extrabold text-xs shadow-xs border border-pink-200 transition cursor-pointer self-start sm:self-auto flex items-center space-x-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Marital &amp; Profile Details</span>
                    </button>
                  </div>

                  {/* Personal Details Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">1. Personal &amp; Demographics</h4>
                      <button 
                        onClick={() => {
                          setEditCustomerData(selectedCustomer);
                          setShowEditModal(true);
                        }}
                        className="text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Personal Info</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                        <p className="text-xs font-extrabold text-slate-900">{selectedCustomer.dob || '1988-05-14'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                        <p className="text-xs font-extrabold text-slate-900">{selectedCustomer.gender || 'Male'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Occupation</span>
                        <p className="text-xs font-extrabold text-slate-900 truncate">{selectedCustomer.occupation || 'Software Architect'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Annual Income</span>
                        <p className="text-xs font-extrabold text-emerald-700">{selectedCustomer.incomeBracket || '₹ 25L - ₹ 50L'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact & KYC Identification */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">2. Identification &amp; Contact Information</h4>
                      <button 
                        onClick={() => {
                          setEditCustomerData(selectedCustomer);
                          setShowEditModal(true);
                        }}
                        className="text-xs font-extrabold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Address &amp; PAN/Aadhaar</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>Primary Mobile: <strong className="font-mono text-slate-900">{selectedCustomer.phone || '9876543210'}</strong></span>
                        </div>
                        {selectedCustomer.alternatePhone && (
                          <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <span>Alternate Mobile: <strong className="font-mono text-slate-900">{selectedCustomer.alternatePhone}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>Email: {selectedCustomer.email || `${selectedCustomer.name?.toLowerCase().replace(/\s+/g, '')}@example.com`}</span>
                        </div>
                        <div className="flex items-start space-x-2 text-slate-600 font-bold text-xs">
                          <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>Address: {selectedCustomer.address || `${selectedCustomer.city || 'Chennai'}`}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          <span>PAN Card: <strong className="font-mono">{selectedCustomer.pan || 'ABCDE1234F'}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span>Aadhaar UIDAI: <strong className="font-mono">{selectedCustomer.aadhaar || '9920-4819-1234'}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span>KYC Status: <span className="badge badge-green text-[10px]">Verified 100%</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FAMILY MEMBERS IN TABULAR COLUMNS */}
              {active360Tab === 'FAMILY' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Family Members Directory</h4>
                      <p className="text-xs text-slate-500">Registered spouse, children, and dependent relatives for festival greetings.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddFamilyModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Family Member</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-pink-600 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-pink-500 text-center w-12">S.No</th>
                          <th className="p-3 border-r border-pink-500">Member Name</th>
                          <th className="p-3 border-r border-pink-500">Relationship</th>
                          <th className="p-3 border-r border-pink-500">Gender</th>
                          <th className="p-3 border-r border-pink-500">Age / DOB</th>
                          <th className="p-3 border-r border-pink-500">Contact Number</th>
                          <th className="p-3 border-r border-pink-500">Wedding Anniversary</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                        {selectedCustomer.familyMembers && selectedCustomer.familyMembers.length > 0 ? (
                          selectedCustomer.familyMembers.map((fm, idx) => (
                            <tr key={fm.id || idx} className="hover:bg-pink-50/50 transition">
                              <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                              <td className="p-3 font-black text-slate-900 border-r border-slate-100">{fm.name}</td>
                              <td className="p-3 border-r border-slate-100">
                                <span className="badge bg-pink-100 text-pink-800 font-extrabold text-[10px]">{fm.relation === 'Other' ? (fm.relationshipName || 'Other Relative') : fm.relation}</span>
                              </td>
                              <td className="p-3 border-r border-slate-100">{fm.gender || (fm.relation === 'Spouse' || fm.relation === 'Mother' || fm.relation === 'Daughter' || fm.relation === 'Sister' ? 'Female' : 'Male')}</td>
                              <td className="p-3 border-r border-slate-100">{fm.dob || '1985-04-12'}</td>
                              <td className="p-3 border-r border-slate-100 font-mono">{fm.phone || selectedCustomer.phone}</td>
                              <td className="p-3 border-r border-slate-100 font-bold text-pink-700">{fm.anniversaryDate || '-'}</td>
                              <td className="p-3 text-center">
                                <span className="badge badge-green text-[9px]">Active</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="p-6 text-center text-xs text-slate-400">
                              No family members registered for this customer yet. Click "Add Family Member" above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: INSURANCE POLICIES */}
              {active360Tab === 'POLICIES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Active Insurance Contracts</h4>
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">{activePoliciesList.length} Policies</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-slate-800">Policy No</th>
                          <th className="p-3 border-r border-slate-800">Insurer &amp; Category</th>
                          <th className="p-3 border-r border-slate-800">Policy / Plan Name</th>
                          <th className="p-3 border-r border-slate-800">Sum Assured</th>
                          <th className="p-3 border-r border-slate-800">Annual Premium</th>
                          <th className="p-3 border-r border-slate-800">Assigned Officer</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                        {activePoliciesList.length > 0 ? (
                          activePoliciesList.map((pol, idx) => (
                            <tr key={pol.id || idx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-100">{pol.id}</td>
                              <td className="p-3 border-r border-slate-100">
                                <p className="font-extrabold text-slate-900">{pol.insuranceCompany}</p>
                                <span className="badge bg-emerald-100 text-emerald-800 text-[9px] font-extrabold mt-0.5">{pol.type || pol.category || 'Insurance'}</span>
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 text-xs">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>{pol.policyName || pol.planName || pol.salesPitch || pol.type || 'Standard Policy Plan'}</span>
                                </div>
                              </td>
                              <td className="p-3 font-bold text-slate-900 border-r border-slate-100">{pol.sumInsured ? `₹ ${Number(pol.sumInsured).toLocaleString()}` : (pol.sumAssured ? `₹ ${Number(pol.sumAssured).toLocaleString()}` : '₹ 5,00,000')}</td>
                              <td className="p-3 font-black text-emerald-700 border-r border-slate-100">{pol.grossPremium ? `₹ ${Number(pol.grossPremium).toLocaleString()} / yr` : (pol.premium ? `₹ ${Number(pol.premium).toLocaleString()} / yr` : '₹ 0.00')}</td>
                              <td className="p-3 border-r border-slate-100">
                                <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold flex items-center space-x-1 w-fit">
                                  <UserCheck className="h-3 w-3" />
                                  <span>{pol.assignedStaff || pol.assignedStaffName || selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</span>
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="badge badge-green text-[9px]">{pol.status || 'ACTIVE'}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-slate-400 font-semibold">No insurance policy contracts attached to this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: CLAIMS HISTORY & ACTIVE ASSISTANCE (DIRECT SYNC WITH CLAIMS DESK) */}
              {active360Tab === 'CLAIMS' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70">
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center space-x-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <span>Claims Record &amp; Assistance Desk</span>
                      </h4>
                      <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                        Claims created or updated here directly synchronize in real-time with the Claims Desk.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="badge bg-amber-200 text-amber-900 text-[10px] font-black">
                        {activeClaimsList.length} Claims Filed
                      </span>
                      <button 
                        onClick={handleOpenAddClaim}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ File New Claim</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-slate-800">Claim ID</th>
                          <th className="p-3 border-r border-slate-800">Insurer &amp; Policy</th>
                          <th className="p-3 border-r border-slate-800">Hospital / Garage</th>
                          <th className="p-3 border-r border-slate-800">Claim Amount</th>
                          <th className="p-3 border-r border-slate-800">Settled Amount</th>
                          <th className="p-3 border-r border-slate-800">Assigned Staff</th>
                          <th className="p-3 border-r border-slate-800 text-center">Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                        {activeClaimsList.length > 0 ? (
                          activeClaimsList.map((clm, cIdx) => (
                            <tr key={clm.id || cIdx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-100">
                                {clm.id}
                                <span className="block text-[10px] text-slate-400 font-normal">{clm.claimDate || 'Recent'}</span>
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <p className="font-extrabold text-slate-900">{clm.insuranceCompany || 'Insurance Provider'}</p>
                                <p className="text-[10px] text-slate-500 font-mono">Policy: {clm.policyNo || 'N/A'}</p>
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <span className="text-slate-800 font-bold">{clm.hospitalOrGarage || clm.hospital || 'Hospital / Workshop'}</span>
                                {clm.claimType && <span className="block text-[10px] text-slate-400 font-semibold">{clm.claimType}</span>}
                              </td>
                              <td className="p-3 font-black text-blue-900 border-r border-slate-100">
                                ₹ {Number(clm.claimAmount || clm.amount || 0).toLocaleString()}
                              </td>
                              <td className="p-3 font-black text-emerald-700 border-r border-slate-100">
                                {Number(clm.settlementAmount || 0) > 0 ? `₹ ${Number(clm.settlementAmount).toLocaleString()}` : <span className="text-slate-400 font-normal text-[11px]">Pending</span>}
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                                  {clm.assignedStaff || clm.assignedStaffName || 'Priya Sharma'}
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center">
                                <select 
                                  value={clm.status || 'SUBMITTED'} 
                                  onChange={(e) => handleQuickStatusChange(clm.id, e.target.value)}
                                  className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border cursor-pointer outline-none ${
                                    clm.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                    clm.status === 'APPROVED' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                    clm.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                    'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value="SUBMITTED">SUBMITTED</option>
                                  <option value="IN_REVIEW">IN_REVIEW</option>
                                  <option value="APPROVED">APPROVED</option>
                                  <option value="SETTLED">SETTLED</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button 
                                    onClick={() => handleOpenEditClaim(clm)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Edit / Update Claim"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClaim360(clm.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Delete Claim"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                              <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                              <p>No claims history filed for {selectedCustomer.name}.</p>
                              <button 
                                onClick={handleOpenAddClaim}
                                className="mt-2 text-xs text-amber-600 hover:underline font-bold cursor-pointer"
                              >
                                + File first claim for this customer
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: RENEWALS */}
              {active360Tab === 'RENEWALS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Policy Renewal Schedule</h4>
                    <span className="badge bg-rose-100 text-rose-800 text-[10px] font-bold">{activeRenewalsList.length} Renewals Scheduled</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-slate-800">Policy No</th>
                          <th className="p-3 border-r border-slate-800">Insurer &amp; Product</th>
                          <th className="p-3 border-r border-slate-800">Due Date</th>
                          <th className="p-3 border-r border-slate-800">Renewal Premium</th>
                          <th className="p-3 border-r border-slate-800">Follow-up Staff</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                        {activeRenewalsList.length > 0 ? (
                          activeRenewalsList.map((rnw, rIdx) => (
                            <tr key={rnw.id || rIdx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-100">{rnw.policyNo}</td>
                              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-100">{rnw.insuranceCompany} ({rnw.type})</td>
                              <td className="p-3 font-bold text-rose-700 border-r border-slate-100">{rnw.dueDate}</td>
                              <td className="p-3 font-black text-emerald-700 border-r border-slate-100">₹ {Number(rnw.premiumAmount || 0).toLocaleString()}</td>
                              <td className="p-3 border-r border-slate-100">
                                <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">{rnw.assignedStaff || 'Priya Sharma'}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="badge bg-amber-100 text-amber-800 text-[9px] font-bold">{rnw.status}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-slate-400 font-semibold">No policy renewals scheduled for this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: PORTFOLIO & INVESTMENTS */}
              {active360Tab === 'PORTFOLIO' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Mutual Funds &amp; Investments Portfolio</h4>
                    <span className="badge bg-purple-100 text-purple-800 text-[10px] font-bold">{activeInvestmentsList.length} Active Holdings</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-slate-800">Investment ID</th>
                          <th className="p-3 border-r border-slate-800">Provider / Scheme</th>
                          <th className="p-3 border-r border-slate-800">Product Type</th>
                          <th className="p-3 border-r border-slate-800">Amount</th>
                          <th className="p-3 border-r border-slate-800">Folio Number</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                        {activeInvestmentsList.length > 0 ? (
                          activeInvestmentsList.map((inv, idx) => (
                            <tr key={inv.id || idx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-100">{inv.id}</td>
                              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-100">{inv.provider}</td>
                              <td className="p-3 border-r border-slate-100"><span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">{inv.type}</span></td>
                              <td className="p-3 font-black text-emerald-700 border-r border-slate-100">₹ {Number(inv.amount || 0).toLocaleString()}</td>
                              <td className="p-3 font-mono border-r border-slate-100">{inv.folioNumber || inv.folio || 'N/A'}</td>
                              <td className="p-3 text-center">
                                <span className={`badge text-[9px] font-extrabold ${inv.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{inv.status || 'ACTIVE'}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-6 text-center text-xs text-slate-400">No active investments or SIP holdings registered.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: TASKS & NOTES */}
              {active360Tab === 'TASKS' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Advisor Tasks &amp; Interaction Logs</h4>

                  <div className="grid grid-cols-1 gap-3">
                    {activeTasksList.map((tsk, tIdx) => (
                      <div key={tsk.id || tIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{tsk.title}</span>
                          <span className="badge bg-blue-100 text-blue-800 text-[10px] font-extrabold">{tsk.status}</span>
                        </div>
                        <p className="text-xs text-slate-500">Due: {tsk.dueDate} • Priority: {tsk.priority} • Assigned: {tsk.assignedStaff}</p>
                      </div>
                    ))}

                    {activeFollowupsList.map((flw, fIdx) => (
                      <div key={flw.id || fIdx} className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-900">{flw.stageName}</span>
                          <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">{flw.status}</span>
                        </div>
                        <p className="text-xs text-slate-600">{flw.conversationNotes}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{flw.date} • Assigned: {flw.assignedTo}</p>
                      </div>
                    ))}

                    {activeTasksList.length === 0 && activeFollowupsList.length === 0 && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                        No tasks or follow-up interaction logs attached to this customer.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAddFamilyModal(true)}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Family Member</span>
                </button>
                <button 
                  onClick={() => {
                    setEditCustomerData(selectedCustomer);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile &amp; Plan</span>
                </button>
                <button 
                  onClick={() => exportCustomer360PDF(selectedCustomer)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export 360 Profile (PDF)</span>
                </button>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to PERMANENTLY DELETE customer profile "${selectedCustomer.name}" (${selectedCustomer.id})?`)) {
                        deleteCustomer(selectedCustomer.id);
                        deleteCustomerBackend(selectedCustomer.id).catch(() => {});
                        closeCustomer360();
                        alert(`Customer "${selectedCustomer.name}" deleted successfully.`);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Customer</span>
                  </button>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL EDIT CUSTOMER 360 MODAL */}
      {showEditModal && editCustomerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  <span>Edit Customer 360 Profile ({editCustomerData.customerCode || editCustomerData.id})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">Update address, PAN, Aadhaar, personal info, active staff, and policy details.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              
              {/* SECTION 1: PERSONAL & DEMOGRAPHICS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span>1. Personal &amp; Demographics</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={editCustomerData.name || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Client Category</label>
                    <select
                      value={editCustomerData.clientCategory || 'New Lead'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, clientCategory: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="New Lead">New Lead 🔵</option>
                      <option value="Existing Lead">Existing Lead 🟣</option>
                      <option value="VIP Client">VIP Client ⭐</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Date of Birth (DOB)</label>
                    <input 
                      type="date"
                      value={editCustomerData.dob || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, dob: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gender</label>
                    <select
                      value={editCustomerData.gender || 'Male'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, gender: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Occupation</label>
                    <input 
                      type="text"
                      placeholder="e.g. Executive"
                      value={editCustomerData.occupation || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, occupation: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Annual Income Bracket</label>
                  <select
                    value={editCustomerData.incomeBracket || '25-50 Lakhs'}
                    onChange={(e) => setEditCustomerData({...editCustomerData, incomeBracket: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Below 5 Lakhs">Below 5 Lakhs</option>
                    <option value="5-10 Lakhs">5 - 10 Lakhs</option>
                    <option value="10-25 Lakhs">10 - 25 Lakhs</option>
                    <option value="25-50 Lakhs">25 - 50 Lakhs</option>
                    <option value="50 Lakhs - 1 Cr">50 Lakhs - 1 Crore</option>
                    <option value="Above 1 Cr">Above 1 Crore (HNI)</option>
                  </select>
                </div>
              </div>

              {/* SECTION 2: CONTACT & RESIDENTIAL ADDRESS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center space-x-1.5">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>2. Contact &amp; Full Residential Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Primary Mobile Phone *</label>
                    <input 
                      type="text"
                      required
                      value={editCustomerData.phone || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, phone: e.target.value, mobileNumber: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Alternate Mobile Number</label>
                    <input 
                      type="text"
                      placeholder="+91 98765 00000 (Optional)"
                      value={editCustomerData.alternatePhone || editCustomerData.altPhone || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, alternatePhone: e.target.value, altPhone: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Email Address</label>
                  <input 
                    type="email"
                    value={editCustomerData.email || ''}
                    onChange={(e) => setEditCustomerData({...editCustomerData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Full Residential Address</label>
                  <textarea 
                    rows={2}
                    placeholder="Door No, Street, Apartment Name, Area..."
                    value={editCustomerData.address || ''}
                    onChange={(e) => setEditCustomerData({...editCustomerData, address: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">City / Town</label>
                    <input 
                      type="text"
                      placeholder="e.g. Chennai / Mumbai"
                      value={editCustomerData.city || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, city: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">State / Pincode</label>
                    <input 
                      type="text"
                      placeholder="e.g. Tamil Nadu - 600001"
                      value={editCustomerData.statePincode || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, statePincode: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: KYC IDENTIFIERS (PAN & AADHAAR) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span>3. Government Identifiers (PAN &amp; Aadhaar)</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">PAN Card Number</label>
                    <input 
                      type="text"
                      placeholder="ABCDE1234F"
                      value={editCustomerData.pan || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, pan: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Aadhaar Card UIDAI Number</label>
                    <input 
                      type="text"
                      placeholder="xxxx-xxxx-9999"
                      value={editCustomerData.aadhaar || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, aadhaar: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: MARITAL STATUS & ANNIVERSARY */}
              <div className="bg-pink-50/70 p-4 rounded-2xl border border-pink-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-pink-900 tracking-wider flex items-center space-x-1.5">
                  <Heart className="h-4 w-4 text-pink-600 fill-pink-600" />
                  <span>4. Marital Status &amp; Family Anniversary</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-pink-800 mb-1">Marital Status</label>
                    <select 
                      value={editCustomerData.maritalStatus || 'Single'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, maritalStatus: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="Single">Single 👤</option>
                      <option value="Married">Married 💍</option>
                    </select>
                  </div>
                  {editCustomerData.maritalStatus === 'Married' && (
                    <div>
                      <label className="block text-[11px] font-black uppercase text-pink-800 mb-1">Wedding Anniversary Date</label>
                      <input 
                        type="date"
                        value={editCustomerData.anniversaryDate || ''}
                        onChange={(e) => setEditCustomerData({...editCustomerData, anniversaryDate: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: ASSIGNED STAFF & POLICY MANAGEMENT */}
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  <span>5. Handling Staff &amp; Active Policy Contract</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-purple-800 mb-1">Present Handling Staff Officer</label>
                    {/* PERMANENT FIX: select by uid so assignedStaffId is atomically updated */}
                    <select
                      value={editCustomerData.assignedStaffId || ''}
                      onChange={(e) => {
                        const selectedSt = staffList360.find(s => s.uid === e.target.value);
                        setEditCustomerData({
                          ...editCustomerData,
                          assignedStaffId:   selectedSt?.uid  || e.target.value,
                          assignedStaffName: selectedSt?.name || editCustomerData.assignedStaffName,
                          assignedAdvisorName: selectedSt?.name || editCustomerData.assignedAdvisorName
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-extrabold bg-white text-purple-900 outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                    >
                      <option value="">-- Select Staff Officer --</option>
                      {staffList360.map((st, idx) => (
                        <option key={st.uid || idx} value={st.uid || st.name}>
                          {st.name} ({st.role || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Type</label>
                    <select 
                      value={editCustomerData.insuranceType || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, insuranceType: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select Insurance Type</option>
                      <option value="LIFE">LIFE Insurance</option>
                      <option value="HEALTH">HEALTH Insurance</option>
                      <option value="MOTOR">MOTOR Insurance</option>
                      <option value="GENERAL">GENERAL Insurance</option>
                      <option value="MUTUAL_FUND">MUTUAL FUND / INVESTMENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company / AMC Name</label>
                    <input 
                      type="text"
                      value={editCustomerData.insuranceCompany || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, insuranceCompany: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-extrabold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Custom Specified Plan Name</label>
                    <input 
                      type="text"
                      value={editCustomerData.salesPitch || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, salesPitch: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Premium Amount (₹)</label>
                    <input 
                      type="number"
                      value={editCustomerData.policyAmount || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, policyAmount: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-extrabold text-emerald-800 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Client Follow-up Status</label>
                    <select 
                      value={editCustomerData.clientStatus || 'Quotation Shared'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, clientStatus: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Quotation Shared">Quotation Shared</option>
                      <option value="Call Back Tomorrow">Call Back Tomorrow</option>
                      <option value="Call Back Scheduled">Call Back Scheduled</option>
                      <option value="Followup Pending">Followup Pending</option>
                      <option value="Appointment Scheduled">Appointment Scheduled</option>
                      <option value="Call Back Weekend">Call Back Weekend</option>
                      <option value="Policy Issued">Policy Issued &amp; Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Advisor Call Notes</label>
                    <input 
                      type="text"
                      value={editCustomerData.advisorNotes || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, advisorNotes: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: CLAIMS HISTORY & CLAIMS DESK MANAGEMENT (DIRECT BIDIRECTIONAL SYNC) */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                      6. Claims History &amp; Claims Desk Sync
                    </h4>
                    <span className="badge bg-amber-200 text-amber-900 text-[10px] font-black">
                      {activeClaimsList.length} Recorded
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddClaim}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add New Claim</span>
                  </button>
                </div>

                {activeClaimsList.length > 0 ? (
                  <div className="space-y-2">
                    {activeClaimsList.map((clm, cIdx) => (
                      <div 
                        key={clm.id || cIdx} 
                        className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-blue-900 text-xs">{clm.id}</span>
                            <span className="text-[10px] text-slate-500 font-bold">• {clm.insuranceCompany || 'Insurer'} ({clm.policyNo || 'No Policy'})</span>
                            <span className={`badge text-[9px] font-extrabold ${
                              clm.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                              clm.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                              clm.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {clm.status || 'SUBMITTED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-semibold">
                            Claim: <strong className="text-slate-900 font-black">₹{Number(clm.claimAmount || clm.amount || 0).toLocaleString()}</strong>
                            {Number(clm.settlementAmount || 0) > 0 && (
                              <span className="ml-2 text-emerald-700 font-bold">| Settled: ₹{Number(clm.settlementAmount).toLocaleString()}</span>
                            )}
                            {clm.hospitalOrGarage && <span className="ml-2 text-slate-500">| {clm.hospitalOrGarage}</span>}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <select
                            value={clm.status || 'SUBMITTED'}
                            onChange={(e) => handleQuickStatusChange(clm.id, e.target.value)}
                            className="text-[10px] font-extrabold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer outline-none"
                          >
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="IN_REVIEW">IN_REVIEW</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="SETTLED">SETTLED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleOpenEditClaim(clm)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Claim"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClaim360(clm.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Claim"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/80 border border-dashed border-amber-200 text-center text-xs text-amber-800 font-semibold">
                    No claims history recorded for this customer yet.
                    <button 
                      type="button" 
                      onClick={handleOpenAddClaim}
                      className="ml-2 text-blue-600 hover:underline font-bold"
                    >
                      + Add claim record
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save All Updated Customer 360 Details</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL ADD FAMILY MEMBER MODAL */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Users className="h-4 w-4 text-pink-600" />
                <span>Add Family Member for Greetings</span>
              </h3>
              <button onClick={() => setShowAddFamilyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Family Member Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Vijeta Dravid"
                  value={newFamilyMember.name}
                  onChange={(e) => setNewFamilyMember({...newFamilyMember, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Relationship</label>
                  <select 
                    value={newFamilyMember.relation}
                    onChange={(e) => setNewFamilyMember({...newFamilyMember, relation: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Spouse">Spouse 💍</option>
                    <option value="Son">Son 👦</option>
                    <option value="Daughter">Daughter 👧</option>
                    <option value="Father">Father 👨</option>
                    <option value="Mother">Mother 👩</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Date of Birth</label>
                  <input 
                    type="date"
                    value={newFamilyMember.dob}
                    onChange={(e) => setNewFamilyMember({...newFamilyMember, dob: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {newFamilyMember.relation === 'Other' && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-purple-700 mb-1">Relationship Name (Required)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Business Partner, Guardian, Dependent Friend"
                    value={newFamilyMember.relationshipName || ''}
                    onChange={(e) => setNewFamilyMember({...newFamilyMember, relationshipName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Mobile Phone (Optional)</label>
                <input 
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newFamilyMember.phone}
                  onChange={(e) => setNewFamilyMember({...newFamilyMember, phone: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Add Family Member Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= GLOBAL FILE NEW CLAIM MODAL (DIRECT SYNC WITH CLAIMS DESK) ================= */}
      {showAddClaimModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <span>File New Insurance Claim for {selectedCustomer.name}</span>
              </h3>
              <button onClick={() => setShowAddClaimModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddClaim} className="space-y-3.5" autoComplete="off">
              {/* Customer Info Pill */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-amber-950">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-amber-700 font-mono">Code: {selectedCustomer.customerCode || selectedCustomer.id} • {selectedCustomer.phone || 'No Phone'}</p>
                </div>
                <span className="badge bg-amber-200 text-amber-900 text-[10px] font-black">Direct Desk Sync</span>
              </div>

              {/* Policy Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Select Policy / Contract *</label>
                <select 
                  value={newClaimData.policyNo}
                  onChange={(e) => {
                    const selNo = e.target.value;
                    const matchedPol = activePoliciesList.find(p => p.id === selNo);
                    setNewClaimData({
                      ...newClaimData,
                      policyNo: selNo,
                      insuranceCompany: matchedPol?.insuranceCompany || newClaimData.insuranceCompany,
                      claimType: matchedPol?.type ? `${matchedPol.type} Claim` : newClaimData.claimType
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {activePoliciesList.length > 0 ? (
                    activePoliciesList.map((pol, idx) => (
                      <option key={pol.id || idx} value={pol.id}>
                        {pol.id} — {pol.insuranceCompany} ({pol.policyName || pol.type || 'Policy'})
                      </option>
                    ))
                  ) : (
                    <option value="POL-GEN-01">POL-GEN-01 (General Active Policy)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider *</label>
                  <input 
                    type="text" 
                    required 
                    value={newClaimData.insuranceCompany}
                    onChange={(e) => setNewClaimData({...newClaimData, insuranceCompany: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Type / Nature *</label>
                  <input 
                    type="text" 
                    required 
                    value={newClaimData.claimType}
                    onChange={(e) => setNewClaimData({...newClaimData, claimType: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={newClaimData.claimAmount}
                    onChange={(e) => setNewClaimData({...newClaimData, claimAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-blue-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Hospital / Garage / Workshop</label>
                  <input 
                    type="text" 
                    value={newClaimData.hospitalOrGarage}
                    onChange={(e) => setNewClaimData({...newClaimData, hospitalOrGarage: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Incident / Claim Date</label>
                  <input 
                    type="date" 
                    value={newClaimData.claimDate}
                    onChange={(e) => setNewClaimData({...newClaimData, claimDate: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Initial Claim Status</label>
                  <select 
                    value={newClaimData.status}
                    onChange={(e) => setNewClaimData({...newClaimData, status: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="SETTLED">SETTLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Assistance Officer</label>
                <select 
                  value={newClaimData.assignedStaff}
                  onChange={(e) => setNewClaimData({...newClaimData, assignedStaff: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">Select Assigned Assistance Officer</option>
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Anitha S. (Insurance Specialist)">Anitha S. (Insurance Specialist)</option>
                  <option value="Karthik Subramanian (Manager)">Karthik Subramanian (Manager)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                  <option value="Rahul Dravid (Staff Advisor)">Rahul Dravid (Staff Advisor)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Submit &amp; Sync Claim to Claims Desk</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= GLOBAL EDIT CLAIM MODAL (DIRECT SYNC WITH CLAIMS DESK) ================= */}
      {showEditClaimModal && editClaimData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                <span>Update Claim Details ({editClaimData.id})</span>
              </h3>
              <button onClick={() => setShowEditClaimModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClaim} className="space-y-3.5" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Status *</label>
                  <select 
                    value={editClaimData.status || 'SUBMITTED'}
                    onChange={(e) => setEditClaimData({...editClaimData, status: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-black bg-white outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="SETTLED">SETTLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Settled / Payout Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editClaimData.settlementAmount || ''}
                    onChange={(e) => setEditClaimData({...editClaimData, settlementAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Total Claim Amount (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={editClaimData.claimAmount || ''}
                    onChange={(e) => setEditClaimData({...editClaimData, claimAmount: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Hospital / Garage</label>
                  <input 
                    type="text" 
                    value={editClaimData.hospitalOrGarage || ''}
                    onChange={(e) => setEditClaimData({...editClaimData, hospitalOrGarage: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Provider</label>
                  <input 
                    type="text" 
                    value={editClaimData.insuranceCompany || ''}
                    onChange={(e) => setEditClaimData({...editClaimData, insuranceCompany: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Number</label>
                  <input 
                    type="text" 
                    value={editClaimData.policyNo || ''}
                    onChange={(e) => setEditClaimData({...editClaimData, policyNo: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Followup Staff</label>
                <select 
                  value={editClaimData.assignedStaff || ''}
                  onChange={(e) => setEditClaimData({...editClaimData, assignedStaff: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">Select Assigned Followup Staff</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                  <option value="Anitha S.">Anitha S.</option>
                  <option value="Karthik Subramanian">Karthik Subramanian</option>
                  <option value="Rajesh V.">Rajesh V.</option>
                  <option value="Rahul Dravid">Rahul Dravid</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Changes &amp; Sync with Claims Desk</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </Customer360Context.Provider>
  );
};

export const useCustomer360 = () => {
  const context = useContext(Customer360Context);
  if (!context) {
    throw new Error('useCustomer360 must be used within a Customer360Provider');
  }
  return context;
};
