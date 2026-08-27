import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { downloadPolicyCertificate, exportFollowupsPDF, exportPoliciesExcel } from '../utils/exportUtils';
import { 
  FileText, Plus, Search, CheckCircle2, Edit3, Trash2, X, 
  Shield, ShieldCheck, Download, Building2, Sparkles, UserCheck, 
  Filter, RotateCcw, FileSpreadsheet, Calendar, Layers, Check,
  BookOpen, FolderPlus, ListPlus, ChevronDown, User
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
  const { policies, addPolicy, deletePolicy, customers, staffList: liveStaffList } = useData();
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
    return [];
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

  // Typeahead / Autocomplete Dropdown States for Issue Policy Modal
  const [showCustSuggest, setShowCustSuggest] = useState(false);
  const [showCompSuggest, setShowCompSuggest] = useState(false);
  const [showCatSuggest, setShowCatSuggest] = useState(false);
  const [showPlanSuggest, setShowPlanSuggest] = useState(false);
  const [showStaffSuggest, setShowStaffSuggest] = useState(false);

  // Refs for closing suggestion dropdowns on click outside
  const custWrapperRef = useRef(null);
  const compWrapperRef = useRef(null);
  const catWrapperRef = useRef(null);
  const planWrapperRef = useRef(null);
  const staffWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (custWrapperRef.current && !custWrapperRef.current.contains(event.target)) {
        setShowCustSuggest(false);
      }
      if (compWrapperRef.current && !compWrapperRef.current.contains(event.target)) {
        setShowCompSuggest(false);
      }
      if (catWrapperRef.current && !catWrapperRef.current.contains(event.target)) {
        setShowCatSuggest(false);
      }
      if (planWrapperRef.current && !planWrapperRef.current.contains(event.target)) {
        setShowPlanSuggest(false);
      }
      if (staffWrapperRef.current && !staffWrapperRef.current.contains(event.target)) {
        setShowStaffSuggest(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // New Policy Form State (Empty by default)
  const [newPolicy, setNewPolicy] = useState({
    customerName: '',
    phone: '',
    insuranceCompany: '',
    type: '',
    policyName: '',
    sumInsured: '',
    grossPremium: '',
    startDate: '',
    expiryDate: '',
    assignedStaff: ''
  });

  // Dynamic Predefined Plans calculation based on selected company & category
  const newPolicyAvailablePlans = useMemo(() => {
    if (!newPolicy.insuranceCompany && !newPolicy.type) return [];
    return getPredefinedPolicies(newPolicy.insuranceCompany, newPolicy.type);
  }, [newPolicy.insuranceCompany, newPolicy.type, catalogVersion]);

  const editingPolicyAvailablePlans = useMemo(() => {
    if (!editingPolicy) return [];
    return getPredefinedPolicies(editingPolicy.insuranceCompany, editingPolicy.type);
  }, [editingPolicy?.insuranceCompany, editingPolicy?.type, catalogVersion]);

  // Autocomplete matching lists: STRICTLY returns results ONLY when user enters meaningful text (FOCUS != SEARCH)
  const filteredCustomers = useMemo(() => {
    const q = String(newPolicy?.customerName || '').toLowerCase().trim();
    if (!q) {
      return [];
    }
    return (customers || []).filter(c => 
      (c?.name && String(c.name).toLowerCase().includes(q)) || 
      (c?.phone && String(c.phone).includes(q)) ||
      (c?.customerCode && String(c.customerCode).toLowerCase().includes(q)) ||
      (c?.id && String(c.id).toLowerCase().includes(q))
    ).slice(0, 10);
  }, [customers, newPolicy?.customerName]);

  // Ranked Company Matching: Starts-With matches prioritized, followed by Contains matches
  const companySearchResults = useMemo(() => {
    const rawList = insuranceCompanies || [];
    const q = String(newPolicy?.insuranceCompany || '').toLowerCase().trim();
    if (!q) {
      return { startsWith: rawList, contains: [], total: rawList.length };
    }
    const startsWith = rawList.filter(c => String(c || '').toLowerCase().trim().startsWith(q));
    const contains = rawList.filter(c => !String(c || '').toLowerCase().trim().startsWith(q) && String(c || '').toLowerCase().includes(q));
    return {
      startsWith,
      contains,
      total: startsWith.length + contains.length
    };
  }, [insuranceCompanies, newPolicy?.insuranceCompany]);

  const allStaffOptions = useMemo(() => {
    const list = (liveStaffList && liveStaffList.length > 0) ? liveStaffList : ((staffList && staffList.length > 0) ? staffList : []);
    return list
      .filter(s => s && (s.name || s.email || s.displayName))
      .map(s => ({
        name: String(s.name || s.displayName || s.email || 'Staff Advisor'),
        role: String(s.role || s.title || 'Advisor'),
        uid: s.uid || s.id || ''
      }));
  }, [liveStaffList, staffList]);

  const staffSearchResults = useMemo(() => {
    const rawList = allStaffOptions || [];
    const q = String(newPolicy?.assignedStaff || '').toLowerCase().trim();
    if (!q) {
      return { startsWith: rawList, contains: [], total: rawList.length };
    }
    const startsWith = rawList.filter(s => {
      const sName = String(s?.name || '').toLowerCase().trim();
      const sRole = String(s?.role || '').toLowerCase().trim();
      return sName.startsWith(q) || sRole.startsWith(q);
    });
    const contains = rawList.filter(s => {
      const sName = String(s?.name || '').toLowerCase().trim();
      const sRole = String(s?.role || '').toLowerCase().trim();
      return !sName.startsWith(q) && !sRole.startsWith(q) && (sName.includes(q) || sRole.includes(q));
    });
    return {
      startsWith,
      contains,
      total: startsWith.length + contains.length
    };
  }, [allStaffOptions, newPolicy?.assignedStaff]);

  const filteredCategories = useMemo(() => {
    const q = String(newPolicy?.type || '').toLowerCase().trim();
    if (!q) return POLICY_CATEGORIES;
    return (POLICY_CATEGORIES || []).filter(cat => String(cat || '').toLowerCase().includes(q));
  }, [newPolicy?.type]);

  const filteredPlans = useMemo(() => {
    const q = String(newPolicy?.policyName || '').toLowerCase().trim();
    if (!q) return newPolicyAvailablePlans || [];
    return (newPolicyAvailablePlans || []).filter(p => String(p || '').toLowerCase().includes(q));
  }, [newPolicyAvailablePlans, newPolicy?.policyName]);

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

  // Highlight Matching Substrings in Search Dropdowns
  const renderHighlight = (text, query) => {
    if (!text) return '';
    const str = String(text);
    if (!query || !String(query).trim()) return str;
    const q = String(query).trim().toLowerCase();
    const lower = str.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return str;
    return (
      <span>
        {str.substring(0, idx)}
        <span className="bg-purple-100 text-purple-950 font-black px-0.5 rounded">{str.substring(idx, idx + q.length)}</span>
        {str.substring(idx + q.length)}
      </span>
    );
  };

  const handleIssuePolicy = async (e) => {
    e.preventDefault();
    if (!newPolicy.customerName.trim() || !newPolicy.grossPremium) {
      alert('Please fill in Customer Name and Gross Premium');
      return;
    }

    const matchedStaff = staffList.find(s => s.name === newPolicy.assignedStaff || s.uid === newPolicy.assignedStaffId);
    const assignedStaffId = matchedStaff?.uid || newPolicy.assignedStaffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = matchedStaff?.name || newPolicy.assignedStaff || user?.name || 'Priya Sharma';

    const planName = newPolicy.policyName.trim() || newPolicy.type;

    const created = await addPolicy({
      customerName: newPolicy.customerName.trim(),
      phone: newPolicy.phone || '',
      insuranceCompany: newPolicy.insuranceCompany.trim(),
      type: newPolicy.type.trim(),
      category: newPolicy.type.trim(),
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

    if (newPolicy.insuranceCompany && !insuranceCompanies.some(c => c.toLowerCase().trim() === newPolicy.insuranceCompany.toLowerCase().trim())) {
      saveCompaniesToStorage([...insuranceCompanies, newPolicy.insuranceCompany.trim()]);
    }

    setShowIssueModal(false);
    setShowCustSuggest(false);
    setShowCompSuggest(false);
    setShowCatSuggest(false);
    setShowPlanSuggest(false);
    setShowStaffSuggest(false);

    setNewPolicy({
      customerName: '',
      phone: '',
      insuranceCompany: '',
      type: '',
      policyName: '',
      sumInsured: '',
      grossPremium: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      assignedStaff: ''
    });
    alert(`Policy ${created?.id || 'POL-NEW'} issued successfully for ${created.customerName} with plan "${planName}"! Directly linked to Customer 360.`);
  };

  const handleSaveEditPolicy = (e) => {
    e.preventDefault();
    if (!editingPolicy) return;

    const planName = editingPolicy.policyName?.trim() || editingPolicy.type;

    const updatedObj = {
      ...editingPolicy,
      insuranceCompany: editingPolicy.insuranceCompany.trim(),
      type: editingPolicy.type.trim(),
      category: editingPolicy.type.trim(),
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

  const handleDeletePolicy = async (id) => {
    if (window.confirm(`Are you sure you want to delete policy ${id}?`)) {
      if (deletePolicy) {
        await deletePolicy(id);
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
                      <span className="uppercase">{pol.customerName}</span>
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
                      <span>{pol.assignedStaff || user?.name || 'Assigned Staff'}</span>
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
                      placeholder="Enter policy plan name..."
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
                      placeholder="Enter company name..."
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

      {/* ================= ISSUE NEW POLICY MODAL (CLEAN & SNAPPY) ================= */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Issue New Insurance Policy</span>
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleIssuePolicy} className="space-y-3.5" autoComplete="off">
              {/* FIELD 1: CUSTOMER FULL NAME (STRICT FOCUS != SEARCH; TYPING = SEARCH) */}
              <div ref={custWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Customer Full Name (CAPITALS ONLY) *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter Customer Full Name in CAPITALS" 
                    value={newPolicy.customerName} 
                    onFocus={() => {
                      if (newPolicy.customerName && newPolicy.customerName.trim().length > 0) {
                        setShowCustSuggest(true);
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewPolicy({...newPolicy, customerName: val});
                      if (val.trim().length > 0) {
                        setShowCustSuggest(true);
                      } else {
                        setShowCustSuggest(false);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white uppercase" 
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Floating Customer Suggestions Dropdown - ONLY appears when user has entered meaningful text */}
                {showCustSuggest && newPolicy.customerName && newPolicy.customerName.trim().length > 0 && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Matching Customers ({filteredCustomers.length})</span>
                      <button 
                        type="button"
                        onClick={() => setShowCustSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredCustomers.map((cust, idx) => (
                      <div 
                        key={cust.id || idx}
                        onClick={() => {
                          setNewPolicy({
                            ...newPolicy,
                            customerName: cust.name,
                            phone: cust.phone || cust.mobileNumber || newPolicy.phone,
                            assignedStaff: cust.assignedAdvisorName || cust.assignedStaff || newPolicy.assignedStaff
                          });
                          setShowCustSuggest(false);
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center">
                            {cust.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{renderHighlight(cust.name, newPolicy.customerName)}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{cust.customerCode || cust.id} • {cust.phone || 'No Phone'}</p>
                          </div>
                        </div>
                        {cust.assignedAdvisorName && (
                          <span className="badge bg-purple-50 text-purple-700 text-[9px] font-extrabold">{cust.assignedAdvisorName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FIELD 2: POLICY CATEGORY / PLAN TYPE */}
              <div ref={catWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Policy Category / Plan Type *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Select or Type Policy Category" 
                    value={newPolicy.type} 
                    onFocus={() => {
                      if (newPolicy.type && newPolicy.type.trim().length > 0) {
                        setShowCatSuggest(true);
                      }
                    }}
                    onChange={(e) => {
                      const typed = e.target.value;
                      const plans = getPredefinedPolicies(newPolicy.insuranceCompany, typed);
                      setNewPolicy({
                        ...newPolicy,
                        type: typed,
                        policyName: plans[0] || newPolicy.policyName
                      });
                      if (typed.trim().length > 0) {
                        setShowCatSuggest(true);
                      } else {
                        setShowCatSuggest(false);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Floating Categories Suggestions Dropdown */}
                {showCatSuggest && newPolicy.type && newPolicy.type.trim().length > 0 && filteredCategories.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Categories ({filteredCategories.length})</span>
                      <button 
                        type="button"
                        onClick={() => setShowCatSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredCategories.map((cat, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const plans = getPredefinedPolicies(newPolicy.insuranceCompany, cat);
                          setNewPolicy({
                            ...newPolicy,
                            type: cat,
                            policyName: plans[0] || newPolicy.policyName
                          });
                          setShowCatSuggest(false);
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between text-xs font-bold text-slate-800"
                      >
                        <span>{renderHighlight(cat, newPolicy.type)}</span>
                        {newPolicy.type === cat && (
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FIELD 3: INSURANCE COMPANY PROVIDER (WITH LIVE PREFIX "STARTS WITH" & "CONTAINS" AUTOCOMPLETE) */}
              <div ref={compWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Insurance Company Provider *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Select or Type Insurance Company" 
                    value={newPolicy.insuranceCompany} 
                    onFocus={() => {
                      if (newPolicy.insuranceCompany && newPolicy.insuranceCompany.trim().length > 0) {
                        setShowCompSuggest(true);
                      }
                    }}
                    onChange={(e) => {
                      const typed = e.target.value;
                      const plans = getPredefinedPolicies(typed, newPolicy.type);
                      setNewPolicy({
                        ...newPolicy,
                        insuranceCompany: typed,
                        policyName: plans[0] || newPolicy.policyName
                      });
                      if (typed.trim().length > 0) {
                        setShowCompSuggest(true);
                      } else {
                        setShowCompSuggest(false);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Floating Companies Suggestions Dropdown */}
                {showCompSuggest && newPolicy.insuranceCompany && newPolicy.insuranceCompany.trim().length > 0 && companySearchResults.total > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Matching Companies ({companySearchResults.total})</span>
                      <button 
                        type="button"
                        onClick={() => setShowCompSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Group 1: Exact Starts With Matches */}
                    {companySearchResults.startsWith.length > 0 && (
                      <div>
                        {newPolicy.insuranceCompany.trim() && (
                          <div className="px-2.5 py-1 bg-purple-50/70 text-[9px] font-black uppercase text-purple-900 tracking-wider">
                            Starts with "{newPolicy.insuranceCompany}" ({companySearchResults.startsWith.length})
                          </div>
                        )}
                        {companySearchResults.startsWith.map((comp, idx) => (
                          <div 
                            key={`start-${idx}`}
                            onClick={() => {
                              const plans = getPredefinedPolicies(comp, newPolicy.type);
                              setNewPolicy({
                                ...newPolicy,
                                insuranceCompany: comp,
                                policyName: plans[0] || newPolicy.policyName
                              });
                              setShowCompSuggest(false);
                            }}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between text-xs font-bold text-slate-800"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="font-extrabold text-slate-900">{renderHighlight(comp, newPolicy.insuranceCompany)}</span>
                            </div>
                            <span className="badge bg-purple-50 text-purple-700 text-[9px] font-black">Starts With</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Group 2: Other Matches Containing Query */}
                    {companySearchResults.contains.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 bg-slate-100 text-[9px] font-black uppercase text-slate-600 tracking-wider">
                          Other Matches Containing "{newPolicy.insuranceCompany}" ({companySearchResults.contains.length})
                        </div>
                        {companySearchResults.contains.map((comp, idx) => (
                          <div 
                            key={`cont-${idx}`}
                            onClick={() => {
                              const plans = getPredefinedPolicies(comp, newPolicy.type);
                              setNewPolicy({
                                ...newPolicy,
                                insuranceCompany: comp,
                                policyName: plans[0] || newPolicy.policyName
                              });
                              setShowCompSuggest(false);
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between text-xs font-bold text-slate-700"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800">{renderHighlight(comp, newPolicy.insuranceCompany)}</span>
                            </div>
                            <span className="badge bg-slate-100 text-slate-600 text-[9px] font-semibold">Contains</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FIELD 4: OFFICIAL POLICY / PLAN NAME */}
              <div ref={planWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Official Policy / Plan Name *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Select or Type Policy Plan Name" 
                    value={newPolicy.policyName} 
                    onFocus={() => {
                      if (newPolicy.policyName && newPolicy.policyName.trim().length > 0) {
                        setShowPlanSuggest(true);
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPolicy({...newPolicy, policyName: val});
                      if (val.trim().length > 0) {
                        setShowPlanSuggest(true);
                      } else {
                        setShowPlanSuggest(false);
                      }
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Floating Plans Suggestions Dropdown - ONLY appears when user types and matching plans exist */}
                {showPlanSuggest && newPolicy.policyName && newPolicy.policyName.trim().length > 0 && filteredPlans.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Matching Plans ({filteredPlans.length})</span>
                      <button 
                        type="button"
                        onClick={() => setShowPlanSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredPlans.map((pName, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setNewPolicy({...newPolicy, policyName: pName});
                          setShowPlanSuggest(false);
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between text-xs font-bold text-slate-800"
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{renderHighlight(pName, newPolicy.policyName)}</span>
                        </div>
                        {newPolicy.policyName === pName && (
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sum Insured (₹ Coverage)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Enter Coverage Amount (₹)"
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
                    placeholder="Enter Annual Premium (₹)"
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
                    value={newPolicy.startDate} 
                    onChange={(e) => setNewPolicy({...newPolicy, startDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expiry / Due Date</label>
                  <input 
                    type="date" 
                    value={newPolicy.expiryDate} 
                    onChange={(e) => setNewPolicy({...newPolicy, expiryDate: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              {/* FIELD 5: ASSIGNED STAFF (WITH LIVE PREFIX "STARTS WITH" & "CONTAINS" AUTOCOMPLETE) */}
              <div ref={staffWrapperRef} className="relative">
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Assigned Staff *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Select or Type Assigned Staff" 
                    value={newPolicy.assignedStaff} 
                    onFocus={() => setShowStaffSuggest(true)}
                    onClick={() => setShowStaffSuggest(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPolicy({...newPolicy, assignedStaff: val});
                      setShowStaffSuggest(true);
                    }} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer" 
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Floating Staff Suggestions Dropdown */}
                {showStaffSuggest && staffSearchResults.total > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="p-2 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between sticky top-0 z-10 border-b">
                      <span>Assigned Staff ({staffSearchResults.total})</span>
                      <button 
                        type="button"
                        onClick={() => setShowStaffSuggest(false)} 
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Group 1: Starts With Matches */}
                    {staffSearchResults.startsWith.length > 0 && (
                      <div>
                        {newPolicy.assignedStaff.trim() && (
                          <div className="px-2.5 py-1 bg-purple-50/70 text-[9px] font-black uppercase text-purple-900 tracking-wider">
                            Starts with "{newPolicy.assignedStaff}" ({staffSearchResults.startsWith.length})
                          </div>
                        )}
                        {staffSearchResults.startsWith.map((stf, idx) => (
                          <div 
                            key={`stf-start-${idx}`}
                            onClick={() => {
                              const displayName = `${stf.name} (${stf.role || 'Advisor'})`;
                              setNewPolicy({
                                ...newPolicy,
                                assignedStaff: displayName,
                                assignedStaffId: stf.uid || newPolicy.assignedStaffId
                              });
                              setShowStaffSuggest(false);
                            }}
                            className="p-2.5 hover:bg-purple-50 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center">
                                {stf.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{renderHighlight(stf.name, newPolicy.assignedStaff)}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{stf.role || 'Advisor'}</p>
                              </div>
                            </div>
                            <span className="badge bg-purple-50 text-purple-700 text-[9px] font-black">{stf.role || 'Advisor'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Group 2: Contains Matches */}
                    {staffSearchResults.contains.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 bg-slate-100 text-[9px] font-black uppercase text-slate-600 tracking-wider">
                          Other Matches Containing "{newPolicy.assignedStaff}" ({staffSearchResults.contains.length})
                        </div>
                        {staffSearchResults.contains.map((stf, idx) => (
                          <div 
                            key={`stf-cont-${idx}`}
                            onClick={() => {
                              const displayName = `${stf.name} (${stf.role || 'Advisor'})`;
                              setNewPolicy({
                                ...newPolicy,
                                assignedStaff: displayName,
                                assignedStaffId: stf.uid || newPolicy.assignedStaffId
                              });
                              setShowStaffSuggest(false);
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center">
                                {stf.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{renderHighlight(stf.name, newPolicy.assignedStaff)}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{stf.role || 'Advisor'}</p>
                              </div>
                            </div>
                            <span className="badge bg-slate-100 text-slate-600 text-[9px] font-black">{stf.role || 'Advisor'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditPolicy} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name (CAPITALS ONLY)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. RAMESH KUMAR"
                  value={editingPolicy.customerName} 
                  onChange={(e) => setEditingPolicy({...editingPolicy, customerName: e.target.value.toUpperCase()})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500 uppercase" 
                />
              </div>

              {/* Insurance Category Selector */}
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
                  {POLICY_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Insurance Provider Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider</label>
                <select 
                  value={insuranceCompanies.includes(editingPolicy.insuranceCompany) ? editingPolicy.insuranceCompany : insuranceCompanies[0]} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const plans = getPredefinedPolicies(val, editingPolicy.type);
                    setEditingPolicy({
                      ...editingPolicy, 
                      insuranceCompany: val, 
                      policyName: plans[0] || editingPolicy.policyName
                    });
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {insuranceCompanies.map((comp, idx) => (
                    <option key={idx} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>

              {/* EDIT MODAL POLICY / PLAN NAME SELECTION */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Official Policy / Plan Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Select or Type Policy Plan Name" 
                  value={editingPolicy.policyName || ''} 
                  onChange={(e) => setEditingPolicy({...editingPolicy, policyName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white" 
                />

                {editingPolicyAvailablePlans.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {editingPolicyAvailablePlans.slice(0, 5).map((pName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingPolicy({...editingPolicy, policyName: pName})}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 rounded-lg text-[10px] font-bold text-slate-800 transition cursor-pointer"
                      >
                        {pName}
                      </button>
                    ))}
                  </div>
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
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff</label>
                <select 
                  value={editingPolicy.assignedStaff || ''} 
                  onChange={(e) => setEditingPolicy({...editingPolicy, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">Select Assigned Staff</option>
                  {allStaffOptions.map((s, idx) => (
                    <option key={s.uid || idx} value={s.name}>
                      {s.name} ({s.role})
                    </option>
                  ))}
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
