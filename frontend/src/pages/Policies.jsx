import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { downloadPolicyCertificate, exportFollowupsPDF, exportPoliciesExcel } from '../utils/exportUtils';
import { 
  FileText, Plus, Search, CheckCircle2, Edit3, Trash2, X, 
  Shield, ShieldCheck, Download, Building2, Sparkles, UserCheck, 
  Filter, RotateCcw, FileSpreadsheet, Calendar, Layers, Check,
  BookOpen, FolderPlus, ListPlus
} from 'lucide-react';
import { 
  INSURANCE_COMPANIES, 
  POLICY_CATEGORIES, 
  getPredefinedPolicies, 
  getLiveCatalog,
  addCustomPlan,
  deleteCustomPlan,
  INSURANCE_PRODUCTS_CATALOG 
} from '../data/insuranceCatalog';

export const Policies = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { policies, addPolicy, setPolicies } = useData();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // Catalog Version State for reactive CRM-wide updates
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Dynamic Insurance Companies List with LocalStorage Persistence
  const [insuranceCompanies, setInsuranceCompanies] = useState(() => {
    const saved = localStorage.getItem('crm_v2_insurance_companies');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INSURANCE_COMPANIES;
  });

  const [staffList] = useState(() => {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { uid: 'UID-STF-1003', name: 'Priya Sharma', role: 'Senior Advisor' },
      { uid: 'UID-STF-1004', name: 'Rahul Dravid', role: 'Staff Advisor' },
      { uid: 'UID-STF-1005', name: 'Kavita Menon', role: 'Advisor' }
    ];
  });

  // Manage Catalog Modal State
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogModalTab, setCatalogModalTab] = useState('PLANS'); // 'PLANS' | 'COMPANIES'
  const [manageSelectedCompany, setManageSelectedCompany] = useState('Star Health Insurance');
  const [manageSelectedCategory, setManageSelectedCategory] = useState('Health Insurance');
  const [newPlanNameInput, setNewPlanNameInput] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [filterPremiumRange, setFilterPremiumRange] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Sync across CRM on custom catalog events
  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCatalogVersion(v => v + 1);
    };
    window.addEventListener('crm_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('crm_catalog_updated', handleCatalogUpdate);
  }, []);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('ALL');
    setFilterCompany('ALL');
    setFilterStatus('ALL');
    setFilterStaff('ALL');
    setFilterPremiumRange('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // New Policy Form State
  const [newPolicy, setNewPolicy] = useState({
    customerName: '',
    insuranceCompany: 'Star Health Insurance',
    customCompany: '',
    type: 'Health Insurance',
    customType: '',
    policyName: 'Star Comprehensive Insurance Policy',
    customPolicyName: '',
    sumInsured: 1000000,
    grossPremium: 25000,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    assignedStaff: 'Priya Sharma (Senior Advisor)'
  });

  // Calculate available predefined plans dynamically when company or category changes
  const newPolicyAvailablePlans = useMemo(() => {
    const comp = newPolicy.insuranceCompany === 'CUSTOM' ? newPolicy.customCompany : newPolicy.insuranceCompany;
    const cat = newPolicy.type === 'CUSTOM' ? newPolicy.customType : newPolicy.type;
    return getPredefinedPolicies(comp, cat);
  }, [newPolicy.insuranceCompany, newPolicy.customCompany, newPolicy.type, newPolicy.customType, catalogVersion]);

  const editingPolicyAvailablePlans = useMemo(() => {
    if (!editingPolicy) return [];
    const comp = editingPolicy.insuranceCompany === 'CUSTOM' ? editingPolicy.customCompany : editingPolicy.insuranceCompany;
    const cat = editingPolicy.type === 'CUSTOM' ? editingPolicy.customType : editingPolicy.type;
    return getPredefinedPolicies(comp, cat);
  }, [editingPolicy?.insuranceCompany, editingPolicy?.customCompany, editingPolicy?.type, editingPolicy?.customType, catalogVersion]);

  // Plans listed inside the Admin Catalog Management Modal
  const currentManagePlansList = useMemo(() => {
    return getPredefinedPolicies(manageSelectedCompany, manageSelectedCategory);
  }, [manageSelectedCompany, manageSelectedCategory, catalogVersion]);

  const saveCompaniesToStorage = (list) => {
    setInsuranceCompanies(list);
    localStorage.setItem('crm_v2_insurance_companies', JSON.stringify(list));
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    if (insuranceCompanies.some(c => c.toLowerCase().trim() === newCompanyName.trim().toLowerCase())) {
      alert("This insurance company already exists in the registry!");
      return;
    }
    const updated = [...insuranceCompanies, newCompanyName.trim()];
    saveCompaniesToStorage(updated);
    setNewCompanyName('');
    alert(`Insurance Company "${newCompanyName.trim()}" registered successfully across the entire CRM!`);
  };

  const handleDeleteCompany = (compName) => {
    if (window.confirm(`Are you sure you want to remove "${compName}" from the insurance companies directory?`)) {
      const updated = insuranceCompanies.filter(c => c !== compName);
      saveCompaniesToStorage(updated);
    }
  };

  // Add Plan Name handler for Admin
  const handleAddNewPlan = (e) => {
    e.preventDefault();
    if (!newPlanNameInput.trim()) return;
    addCustomPlan(manageSelectedCompany, manageSelectedCategory, newPlanNameInput.trim());
    setCatalogVersion(v => v + 1);
    const addedName = newPlanNameInput.trim();
    setNewPlanNameInput('');
    alert(`Plan "${addedName}" added to "${manageSelectedCompany}" (${manageSelectedCategory})!\n\nThis plan is now directly available across all policy forms in the CRM.`);
  };

  // Delete Plan Name handler for Admin
  const handleDeletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to remove plan "${planName}" from "${manageSelectedCompany}" (${manageSelectedCategory})?`)) {
      deleteCustomPlan(manageSelectedCompany, manageSelectedCategory, planName);
      setCatalogVersion(v => v + 1);
    }
  };

  const handleIssuePolicy = async (e) => {
    e.preventDefault();
    if (!newPolicy.customerName || !newPolicy.grossPremium) {
      alert('Please fill in Customer Name and Gross Premium');
      return;
    }

    const company = newPolicy.insuranceCompany === 'CUSTOM' ? newPolicy.customCompany : newPolicy.insuranceCompany;
    const category = newPolicy.type === 'CUSTOM' ? newPolicy.customType : newPolicy.type;
    const planName = newPolicy.policyName === 'CUSTOM' 
      ? newPolicy.customPolicyName 
      : (newPolicy.policyName || newPolicy.customPolicyName || category);

    const matchedStaff = staffList.find(s => s.name === newPolicy.assignedStaff || s.uid === newPolicy.assignedStaffId);
    const assignedStaffId = matchedStaff?.uid || newPolicy.assignedStaffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = matchedStaff?.name || newPolicy.assignedStaff || user?.name || 'Priya Sharma';

    const created = await addPolicy({
      customerName: newPolicy.customerName,
      insuranceCompany: company,
      type: category,
      category: category,
      policyName: planName,
      planName: planName,
      sumInsured: parseFloat(newPolicy.sumInsured || 0),
      grossPremium: parseFloat(newPolicy.grossPremium || 0),
      startDate: newPolicy.startDate,
      expiryDate: newPolicy.expiryDate,
      status: 'ACTIVE',
      assignedStaffId,
      assignedStaffName,
      assignedStaff: assignedStaffName,
      branchId: matchedStaff?.branch || 'BR-KNM-001'
    });

    if (newPolicy.insuranceCompany === 'CUSTOM' && newPolicy.customCompany && !insuranceCompanies.includes(newPolicy.customCompany)) {
      saveCompaniesToStorage([...insuranceCompanies, newPolicy.customCompany]);
    }

    setShowIssueModal(false);
    setNewPolicy({
      customerName: '',
      insuranceCompany: 'Star Health Insurance',
      customCompany: '',
      type: 'Health Insurance',
      customType: '',
      policyName: 'Star Comprehensive Insurance Policy',
      customPolicyName: '',
      sumInsured: 1000000,
      grossPremium: 25000,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      assignedStaff: user?.name || 'Priya Sharma (Senior Advisor)'
    });
    alert(`Policy ${created?.id || 'POL-NEW'} issued successfully for ${newPolicy.customerName} with plan "${planName}"!`);
  };

  const handleSaveEditPolicy = (e) => {
    e.preventDefault();
    if (!editingPolicy) return;

    const company = editingPolicy.insuranceCompany === 'CUSTOM' ? editingPolicy.customCompany : editingPolicy.insuranceCompany;
    const category = editingPolicy.type === 'CUSTOM' ? editingPolicy.customType : editingPolicy.type;
    const planName = editingPolicy.policyName === 'CUSTOM'
      ? editingPolicy.customPolicyName
      : (editingPolicy.policyName || editingPolicy.customPolicyName || category);

    const updatedObj = {
      ...editingPolicy,
      insuranceCompany: company,
      type: category,
      category: category,
      policyName: planName,
      planName: planName,
      sumInsured: parseFloat(editingPolicy.sumInsured || 0),
      grossPremium: parseFloat(editingPolicy.grossPremium || 0)
    };

    if (setPolicies) {
      setPolicies(prev => prev.map(p => p.id === updatedObj.id ? updatedObj : p));
    }
    setShowEditModal(false);
    setEditingPolicy(null);
    alert(`Policy ${updatedObj.id} updated successfully with Plan: "${planName}"!`);
  };

  const handleDeletePolicy = (id) => {
    if (window.confirm(`Are you sure you want to delete policy ${id}?`)) {
      if (setPolicies) {
        setPolicies(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const filteredPolicies = useMemo(() => {
    return (policies || []).filter(pol => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (pol.id || '').toLowerCase().includes(term) ||
        (pol.customerName || '').toLowerCase().includes(term) ||
        (pol.insuranceCompany || '').toLowerCase().includes(term) ||
        (pol.policyName || pol.planName || '').toLowerCase().includes(term) ||
        (pol.type || pol.category || '').toLowerCase().includes(term) ||
        (pol.assignedStaffName || pol.assignedStaff || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterCategory !== 'ALL') {
        const typeLower = (pol.type || pol.category || '').toLowerCase();
        if (filterCategory === 'HEALTH' && !typeLower.includes('health') && !typeLower.includes('medic')) return false;
        if (filterCategory === 'LIFE' && !typeLower.includes('life') && !typeLower.includes('ulip') && !typeLower.includes('term') && !typeLower.includes('endowment') && !typeLower.includes('pension')) return false;
        if (filterCategory === 'MOTOR' && !typeLower.includes('motor') && !typeLower.includes('car') && !typeLower.includes('vehicle')) return false;
        if (filterCategory === 'GENERAL' && !typeLower.includes('general') && !typeLower.includes('travel') && !typeLower.includes('fire') && !typeLower.includes('commercial')) return false;
      }

      if (filterCompany !== 'ALL') {
        const companyName = (pol.insuranceCompany || '').toLowerCase();
        if (!companyName.includes(filterCompany.toLowerCase())) return false;
      }

      if (filterStatus !== 'ALL') {
        const polStatus = (pol.status || 'ACTIVE').toUpperCase();
        if (filterStatus === 'ACTIVE' && polStatus !== 'ACTIVE') return false;
        if (filterStatus === 'PENDING_RENEWAL' && polStatus !== 'DUE' && polStatus !== 'PENDING' && polStatus !== 'DUE_RENEWAL') return false;
        if (filterStatus === 'EXPIRED' && polStatus !== 'EXPIRED' && polStatus !== 'LAPSED') return false;
      }

      if (filterStaff !== 'ALL') {
        const staffName = (pol.assignedStaffName || pol.assignedStaff || '').toLowerCase();
        if (!staffName.includes(filterStaff.toLowerCase())) return false;
      }

      if (filterPremiumRange !== 'ALL') {
        const prem = Number(pol.grossPremium || 0);
        if (filterPremiumRange === 'BELOW_10K' && prem >= 10000) return false;
        if (filterPremiumRange === '10K_50K' && (prem < 10000 || prem > 50000)) return false;
        if (filterPremiumRange === '50K_1L' && (prem < 50000 || prem > 100000)) return false;
        if (filterPremiumRange === 'ABOVE_1L' && prem <= 100000) return false;
      }

      if (filterStartDate) {
        if (pol.startDate && pol.startDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (pol.startDate && pol.startDate > filterEndDate) return false;
      }

      return true;
    });
  }, [policies, searchTerm, filterCategory, filterCompany, filterStatus, filterStaff, filterPremiumRange, filterStartDate, filterEndDate]);

  const activeFiltersCount = (searchTerm ? 1 : 0) +
    (filterCategory !== 'ALL' ? 1 : 0) +
    (filterCompany !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterStaff !== 'ALL' ? 1 : 0) +
    (filterPremiumRange !== 'ALL' ? 1 : 0) +
    (filterStartDate ? 1 : 0) +
    (filterEndDate ? 1 : 0);

  // Extract unique staff members for dropdown
  const uniqueStaffAdvisors = useMemo(() => {
    const set = new Set();
    (policies || []).forEach(p => {
      const name = p.assignedStaffName || p.assignedStaff;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [policies]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Policies Register</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button 
                onClick={() => exportFollowupsPDF(filteredPolicies)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>

              <button 
                onClick={() => exportPoliciesExcel(filteredPolicies)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}

          {/* Admin Managed Plans & Catalog Button */}
          <button 
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs shadow-xs border border-purple-200 transition cursor-pointer"
            title="Configure and add custom plan names and company categories"
          >
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Manage Plans &amp; Catalog</span>
          </button>

          <button 
            onClick={() => setShowIssueModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Issue New Policy</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Level Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
        {/* Row 1: Search & Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Customer, Policy Name, Insurer, ID or Advisor..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none" 
            />
          </div>

          <div className="md:col-span-8 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-500 mr-1 flex items-center space-x-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Category:</span>
            </span>
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'HEALTH', label: '🏥 Health' },
              { id: 'LIFE', label: '🛡️ Life / Term / ULIP' },
              { id: 'MOTOR', label: '🚗 Motor' },
              { id: 'GENERAL', label: '🏢 General / Travel / Fire' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  filterCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="ml-auto flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-black transition cursor-pointer"
                title="Reset all applied filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
          {/* Company Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Insurance Company</label>
            <select 
              value={filterCompany} 
              onChange={(e) => setFilterCompany(e.target.value)} 
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Insurers ({insuranceCompanies.length})</option>
              {insuranceCompanies.map((comp, idx) => (
                <option key={idx} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Policy Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">✅ Active</option>
              <option value="PENDING_RENEWAL">⏳ Due for Renewal</option>
              <option value="EXPIRED">❌ Expired / Lapsed</option>
            </select>
          </div>

          {/* Assigned Staff Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Assigned Officer</label>
            <select 
              value={filterStaff} 
              onChange={(e) => setFilterStaff(e.target.value)} 
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Officers</option>
              {uniqueStaffAdvisors.map((staff, idx) => (
                <option key={idx} value={staff}>{staff}</option>
              ))}
            </select>
          </div>

          {/* Premium Range Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Premium Range</label>
            <select 
              value={filterPremiumRange} 
              onChange={(e) => setFilterPremiumRange(e.target.value)} 
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Premiums</option>
              <option value="BELOW_10K">&lt; ₹10,000 / yr</option>
              <option value="10K_50K">₹10K - ₹50K / yr</option>
              <option value="50K_1L">₹50K - ₹1 Lakh / yr</option>
              <option value="ABOVE_1L">&gt; ₹1 Lakh / yr</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">From Start Date</label>
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={(e) => setFilterStartDate(e.target.value)} 
              className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">To Start Date</label>
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={(e) => setFilterEndDate(e.target.value)} 
              className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t pt-3">
          <span>Showing <strong className="text-slate-900">{filteredPolicies.length}</strong> of <strong className="text-slate-900">{policies.length}</strong> total registered policies</span>
          {filteredPolicies.length === 0 && (
            <span className="text-rose-600 font-extrabold">No matching policies found for selected filter criteria.</span>
          )}
        </div>
      </div>

      {/* Policy Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Policy Number &amp; Client</th>
                <th className="p-4">Insurer &amp; Category</th>
                <th className="p-4">Policy / Plan Name</th>
                <th className="p-4">Sum Insured</th>
                <th className="p-4">Gross Premium</th>
                <th className="p-4">Validity</th>
                <th className="p-4">Assigned Staff</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredPolicies.map(pol => (
                <tr key={pol.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4">
                    <button
                      onClick={() => openCustomer360(pol.customerName)}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile"
                    >
                      <span>{pol.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pol.id}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 flex items-center space-x-1">
                      <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{pol.insuranceCompany}</span>
                    </p>
                    <span className="badge badge-brand text-[10px] mt-1">{pol.type || pol.category || 'Insurance'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1.5 font-black text-slate-900 text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="max-w-[220px] truncate" title={pol.policyName || pol.planName || pol.type}>
                        {pol.policyName || pol.planName || pol.type || 'Standard Policy Plan'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      Category: <strong className="text-slate-700">{pol.type || 'General'}</strong>
                    </span>
                  </td>
                  <td className="p-4 font-extrabold text-slate-900">
                    ₹{(pol.sumInsured / 100000).toFixed(1)} Lakhs
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-700">
                    ₹{pol.grossPremium.toLocaleString()} / yr
                  </td>
                  <td className="p-4 text-[11px]">
                    <p className="text-slate-600">Issued: {pol.startDate}</p>
                    <p className="text-rose-600 font-bold">Expires: {pol.expiryDate}</p>
                  </td>
                  <td className="p-4">
                    <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-purple-600 shrink-0" />
                      <span>{pol.assignedStaff || 'Priya Sharma (Senior Advisor)'}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                      <button 
                        onClick={() => downloadPolicyCertificate({
                          id: pol.id,
                          customerName: pol.customerName,
                          type: pol.type,
                          category: pol.category,
                          policyName: pol.policyName || pol.planName || pol.type,
                          provider: pol.insuranceCompany,
                          sumAssured: pol.sumInsured,
                          premium: pol.grossPremium,
                          expiryDate: pol.expiryDate,
                          status: pol.status
                        })} 
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-[11px] transition cursor-pointer"
                        title="Download PDF Certificate"
                      >
                        Certificate (PDF)
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setEditingPolicy({
                          ...pol,
                          customCompany: '',
                          customType: '',
                          customPolicyName: ''
                        });
                        setShowEditModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-extrabold text-[11px] transition cursor-pointer"
                      title="Edit Policy Details"
                    >
                      <Edit3 className="h-3.5 w-3.5 inline" />
                    </button>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDeletePolicy(pol.id)} 
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] transition cursor-pointer"
                        title="Delete Policy"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADMIN MASTER CATALOG & PLANS MANAGEMENT MODAL ================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  <span>Insurance Catalog &amp; Plan Management Center</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Configure real-world policy plan names for each company &amp; category. Changes reflect instantly across all CRM dropdowns and forms.
                </p>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setCatalogModalTab('PLANS')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  catalogModalTab === 'PLANS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>1. Manage Policy Plans ({manageSelectedCompany})</span>
              </button>
              <button
                onClick={() => setCatalogModalTab('COMPANIES')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  catalogModalTab === 'COMPANIES' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>2. Manage Insurance Companies ({insuranceCompanies.length})</span>
              </button>
            </div>

            {/* TAB 1: MANAGE PLAN NAMES BY COMPANY & CATEGORY */}
            {catalogModalTab === 'PLANS' && (
              <div className="space-y-4">
                {/* Select Company & Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-purple-950 mb-1">
                      Step 1: Select Insurance Company
                    </label>
                    <select
                      value={manageSelectedCompany}
                      onChange={(e) => setManageSelectedCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {insuranceCompanies.map((comp, idx) => (
                        <option key={idx} value={comp}>{comp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-purple-950 mb-1">
                      Step 2: Select Policy Category
                    </label>
                    <select
                      value={manageSelectedCategory}
                      onChange={(e) => setManageSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {POLICY_CATEGORIES.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add New Plan Name Form */}
                <form onSubmit={handleAddNewPlan} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <ListPlus className="h-4 w-4 text-purple-600" />
                      <span>Add New Policy / Plan Name to {manageSelectedCompany}</span>
                    </span>
                    <span className="text-purple-700 font-extrabold text-[10px]">{manageSelectedCategory}</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Star Comprehensive Platinum Cover / Optima Super Secure 4X..."
                      value={newPlanNameInput}
                      onChange={(e) => setNewPlanNameInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Plan</span>
                    </button>
                  </div>
                </form>

                {/* Active Registered Plans List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500">
                      Active Registered Plans ({currentManagePlansList.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {manageSelectedCompany} • {manageSelectedCategory}
                    </span>
                  </div>

                  {currentManagePlansList.length === 0 ? (
                    <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-bold">
                      No custom plans configured for this company/category yet. Add one using the form above!
                    </div>
                  ) : (
                    currentManagePlansList.map((planName, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs hover:border-purple-300 transition">
                        <div className="flex items-center space-x-2.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-extrabold text-slate-900">{planName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{manageSelectedCompany}</p>
                          </div>
                        </div>

                        {isAdmin && (
                          <button 
                            onClick={() => handleDeletePlan(planName)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Remove "${planName}" from catalog`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE INSURANCE COMPANIES */}
            {catalogModalTab === 'COMPANIES' && (
              <div className="space-y-4">
                {/* Add New Company Form */}
                <form onSubmit={handleAddCompany} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center space-x-1.5">
                    <FolderPlus className="h-4 w-4 text-purple-600" />
                    <span>Register New Insurance Company</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kotak General Insurance / Universal Sompo..."
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Insurer</span>
                    </button>
                  </div>
                </form>

                {/* Company List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <span className="text-[11px] font-black uppercase text-slate-500 block mb-1">
                    Registered Insurance Providers ({insuranceCompanies.length})
                  </span>
                  {insuranceCompanies.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs hover:border-purple-300 transition">
                      <span className="flex items-center space-x-2.5">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        <span className="font-extrabold text-slate-900">{comp}</span>
                      </span>

                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteCompany(comp)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Company"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <button 
                onClick={() => setShowCatalogModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer"
              >
                Close Catalog Management Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ISSUE NEW POLICY MODAL ================= */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Issue New Insurance Policy</span>
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleIssuePolicy} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter Customer Full Name" 
                  value={newPolicy.customerName} 
                  onChange={(e) => setNewPolicy({...newPolicy, customerName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-semibold" 
                />
              </div>

              {/* Insurance Provider Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider *</label>
                <select 
                  value={newPolicy.insuranceCompany} 
                  onChange={(e) => {
                    const newComp = e.target.value;
                    const plans = getPredefinedPolicies(newComp, newPolicy.type);
                    setNewPolicy({
                      ...newPolicy, 
                      insuranceCompany: newComp,
                      policyName: plans[0] || ''
                    });
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {insuranceCompanies.map((comp, idx) => (
                    <option key={idx} value={comp}>{comp}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom Company Name...</option>
                </select>

                {newPolicy.insuranceCompany === 'CUSTOM' && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom insurance company name..."
                    value={newPolicy.customCompany}
                    onChange={(e) => setNewPolicy({...newPolicy, customCompany: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                )}
              </div>

              {/* Insurance Category Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Category / Plan Type *</label>
                <select 
                  value={newPolicy.type} 
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const plans = getPredefinedPolicies(newPolicy.insuranceCompany, newCat);
                    setNewPolicy({
                      ...newPolicy, 
                      type: newCat,
                      policyName: plans[0] || ''
                    });
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Health Insurance">Health Insurance 🏥</option>
                  <option value="Term Life Insurance">Term Life Insurance 🛡️</option>
                  <option value="Savings & Investment (ULIP / Guaranteed)">Savings &amp; Investment (ULIP / Guaranteed) 📈</option>
                  <option value="Motor Insurance (Car / Two Wheeler)">Motor Insurance (Car / Two Wheeler) 🚗</option>
                  <option value="Commercial & Fire Insurance">Commercial &amp; Fire Insurance 🏢</option>
                  <option value="Travel Insurance">Travel Insurance ✈️</option>
                  <option value="Personal Accident Insurance">Personal Accident Insurance ⚡</option>
                  <option value="Critical Illness Cover">Critical Illness Cover 🩺</option>
                  <option value="Pension & Retirement Annuity">Pension &amp; Retirement Annuity 🏖️</option>
                  <option value="CUSTOM">+ Write / Enter Custom Plan Type...</option>
                </select>

                {newPolicy.type === 'CUSTOM' && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom policy type (e.g. Cyber Security Insurance)..."
                    value={newPolicy.customType}
                    onChange={(e) => setNewPolicy({...newPolicy, customType: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                )}
              </div>

              {/* NEW SECTION: POLICY / PLAN NAME SELECTION (PREDEFINED ONLINE CATALOG) */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase text-blue-950 flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Official Policy / Plan Name (Online Predefined Catalog) *</span>
                  </label>
                  <span className="badge bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                    {newPolicyAvailablePlans.length} Predefined Plans
                  </span>
                </div>

                <select 
                  value={newPolicyAvailablePlans.includes(newPolicy.policyName) ? newPolicy.policyName : (newPolicy.policyName ? 'CUSTOM' : '')} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setNewPolicy({...newPolicy, policyName: 'CUSTOM', customPolicyName: newPolicy.policyName !== 'CUSTOM' ? newPolicy.policyName : ''});
                    } else {
                      setNewPolicy({...newPolicy, policyName: val, customPolicyName: ''});
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Select Predefined Policy Name ({newPolicyAvailablePlans.length} Available) --</option>
                  {newPolicyAvailablePlans.map((pName, idx) => (
                    <option key={idx} value={pName}>{pName}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom Policy Plan Name...</option>
                </select>

                {(newPolicy.policyName === 'CUSTOM' || !newPolicyAvailablePlans.includes(newPolicy.policyName)) && (
                  <input 
                    type="text"
                    required
                    placeholder="Type custom policy plan name (e.g. Star Comprehensive Platinum Cover)..."
                    value={newPolicy.customPolicyName || newPolicy.policyName}
                    onChange={(e) => setNewPolicy({...newPolicy, customPolicyName: e.target.value, policyName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-blue-400 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sum Insured (₹ Coverage)</label>
                  <input 
                    type="number" 
                    required 
                    value={newPolicy.sumInsured} 
                    onChange={(e) => setNewPolicy({...newPolicy, sumInsured: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Annual Premium (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={newPolicy.grossPremium} 
                    onChange={(e) => setNewPolicy({...newPolicy, grossPremium: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-emerald-700" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Issue Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newPolicy.startDate} 
                    onChange={(e) => setNewPolicy({...newPolicy, startDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expiry / Due Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newPolicy.expiryDate} 
                    onChange={(e) => setNewPolicy({...newPolicy, expiryDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Officer</label>
                <select 
                  value={newPolicy.assignedStaff} 
                  onChange={(e) => setNewPolicy({...newPolicy, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                >
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Anitha S. (Insurance Specialist)">Anitha S. (Insurance Specialist)</option>
                  <option value="Karthik Subramanian (Manager)">Karthik Subramanian (Manager)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Issue &amp; Save Policy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT POLICY MODAL ================= */}
      {showEditModal && editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span>Edit Policy Details ({editingPolicy.id})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditPolicy} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={editingPolicy.customerName} 
                  onChange={(e) => setEditingPolicy({...editingPolicy, customerName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>

              {/* Insurance Provider Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider</label>
                <select 
                  value={insuranceCompanies.includes(editingPolicy.insuranceCompany) ? editingPolicy.insuranceCompany : 'CUSTOM'} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setEditingPolicy({...editingPolicy, insuranceCompany: 'CUSTOM', customCompany: editingPolicy.insuranceCompany});
                    } else {
                      const plans = getPredefinedPolicies(val, editingPolicy.type);
                      setEditingPolicy({
                        ...editingPolicy, 
                        insuranceCompany: val, 
                        customCompany: '',
                        policyName: plans[0] || editingPolicy.policyName
                      });
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {insuranceCompanies.map((comp, idx) => (
                    <option key={idx} value={comp}>{comp}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom Company Name...</option>
                </select>

                {(editingPolicy.insuranceCompany === 'CUSTOM' || !insuranceCompanies.includes(editingPolicy.insuranceCompany)) && (
                  <input 
                    type="text"
                    required
                    placeholder="Enter custom insurance company name..."
                    value={editingPolicy.customCompany || editingPolicy.insuranceCompany}
                    onChange={(e) => setEditingPolicy({...editingPolicy, customCompany: e.target.value, insuranceCompany: e.target.value})}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Insurance Category Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Category / Plan Type</label>
                <select 
                  value={editingPolicy.type} 
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const plans = getPredefinedPolicies(editingPolicy.insuranceCompany, newCat);
                    setEditingPolicy({
                      ...editingPolicy, 
                      type: newCat,
                      policyName: plans[0] || editingPolicy.policyName
                    });
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Health Insurance">Health Insurance 🏥</option>
                  <option value="Term Life Insurance">Term Life Insurance 🛡️</option>
                  <option value="Savings & Investment (ULIP / Guaranteed)">Savings &amp; Investment (ULIP / Guaranteed) 📈</option>
                  <option value="Motor Insurance (Car / Two Wheeler)">Motor Insurance (Car / Two Wheeler) 🚗</option>
                  <option value="Commercial & Fire Insurance">Commercial &amp; Fire Insurance 🏢</option>
                  <option value="Travel Insurance">Travel Insurance ✈️</option>
                  <option value="Personal Accident Insurance">Personal Accident Insurance ⚡</option>
                  <option value="Critical Illness Cover">Critical Illness Cover 🩺</option>
                  <option value="Pension & Retirement Annuity">Pension &amp; Retirement Annuity 🏖️</option>
                  <option value="CUSTOM">+ Write / Enter Custom Plan Type...</option>
                </select>
              </div>

              {/* EDIT MODAL POLICY / PLAN NAME SELECTION */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase text-amber-950 flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Official Policy / Plan Name (Online Predefined Catalog)</span>
                  </label>
                  <span className="badge bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                    {editingPolicyAvailablePlans.length} Predefined Plans
                  </span>
                </div>

                <select 
                  value={editingPolicyAvailablePlans.includes(editingPolicy.policyName) ? editingPolicy.policyName : (editingPolicy.policyName ? 'CUSTOM' : '')} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setEditingPolicy({...editingPolicy, policyName: 'CUSTOM', customPolicyName: editingPolicy.policyName !== 'CUSTOM' ? editingPolicy.policyName : ''});
                    } else {
                      setEditingPolicy({...editingPolicy, policyName: val, customPolicyName: ''});
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-extrabold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">-- Select Predefined Policy Name ({editingPolicyAvailablePlans.length} Available) --</option>
                  {editingPolicyAvailablePlans.map((pName, idx) => (
                    <option key={idx} value={pName}>{pName}</option>
                  ))}
                  <option value="CUSTOM">+ Write / Enter Custom Policy Plan Name...</option>
                </select>

                {(editingPolicy.policyName === 'CUSTOM' || !editingPolicyAvailablePlans.includes(editingPolicy.policyName)) && (
                  <input 
                    type="text"
                    required
                    placeholder="Type custom policy plan name..."
                    value={editingPolicy.customPolicyName || editingPolicy.policyName || ''}
                    onChange={(e) => setEditingPolicy({...editingPolicy, customPolicyName: e.target.value, policyName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-amber-400 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sum Insured (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingPolicy.sumInsured} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, sumInsured: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500 font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Annual Premium (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingPolicy.grossPremium} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, grossPremium: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-emerald-700" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Issue Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={editingPolicy.startDate} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, startDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expiry / Due Date</label>
                  <input 
                    type="date" 
                    required 
                    value={editingPolicy.expiryDate} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, expiryDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Officer</label>
                <select 
                  value={editingPolicy.assignedStaff || 'Priya Sharma (Senior Advisor)'} 
                  onChange={(e) => setEditingPolicy({...editingPolicy, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Anitha S. (Insurance Specialist)">Anitha S. (Insurance Specialist)</option>
                  <option value="Karthik Subramanian (Manager)">Karthik Subramanian (Manager)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Save &amp; Update Policy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
