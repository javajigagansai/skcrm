import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCustomer360 } from '../context/Customer360Context';
import { exportCustomer360PDF, exportCustomerRegistryPDF, exportFollowupsPDF, exportFollowupsExcel } from '../utils/exportUtils';
import { 
  Plus, Search, UserCheck, X, Heart, Cake, Calendar, Users, 
  Briefcase, ShieldCheck, FileText, Phone, Mail, MapPin, CreditCard, 
  ChevronRight, Edit3, Trash2, Sparkles, Download, CheckCircle2,
  Gift, Award, IndianRupee, ExternalLink, FileSpreadsheet
} from 'lucide-react';

export const Customers = () => {
  const { user } = useAuth();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const { openCustomer360 } = useCustomer360();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarital, setFilterMarital] = useState('ALL');

  const [colFilters, setColFilters] = useState({
    date: '',
    clientCategory: 'ALL',
    name: '',
    phone: '',
    assignedStaff: 'ALL',
    insurer: '',
    salesPitch: '',
    clientStatus: 'ALL',
    advisorNotes: ''
  });
  
  // Modals & Deletion State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [active360Tab, setActive360Tab] = useState('OVERVIEW');
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { name: 'Priya Sharma', role: 'EMPLOYEE' },
      { name: 'Rahul Dravid', role: 'EMPLOYEE' },
      { name: 'Kavita Menon', role: 'EMPLOYEE' },
      { name: 'Branch Manager', role: 'MANAGER' },
      { name: 'Prakash Gajendiran', role: 'SUPER_ADMIN' }
    ];
  });

  // Real-time listener for User Management updates
  useEffect(() => {
    const handleUsersUpdate = () => {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
        } catch (e) {}
      }
    };

    window.addEventListener('storage_users_updated', handleUsersUpdate);
    window.addEventListener('storage', handleUsersUpdate);
    return () => {
      window.removeEventListener('storage_users_updated', handleUsersUpdate);
      window.removeEventListener('storage', handleUsersUpdate);
    };
  }, []);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    maritalStatus: 'Single',
    anniversaryDate: '',
    city: '',
    address: '',
    pan: '',
    aadhaar: '',
    occupation: '',
    incomeBracket: '',
    insuranceCompany: 'Tata AIA Life',
    insuranceType: 'LIFE',
    salesPitch: 'Savings & Retirement Plan',
    clientStatus: 'Quotation Shared',
    advisorNotes: '',
    assignedAdvisorName: user?.name || 'Priya Sharma',
    familyMembers: []
  });

  // Edit Customer Form State
  const [editCustomerData, setEditCustomerData] = useState(null);

  // New Family Member State
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: '',
    relation: 'Spouse',
    dob: '',
    anniversaryDate: '',
    phone: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomersBackend();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Please fill in Customer Name and Mobile Phone');
      return;
    }

    const createdObj = {
      date: new Date().toISOString().split('T')[0],
      clientCategory: newCustomer.clientCategory || '',
      name: newCustomer.name,
      email: newCustomer.email || '',
      phone: newCustomer.phone,
      mobileNumber: newCustomer.phone,
      insuranceType: newCustomer.insuranceType || '',
      insuranceCompany: newCustomer.insuranceCompany || '',
      salesPitch: newCustomer.salesPitch || '',
      policyAmount: newCustomer.policyAmount ? Number(newCustomer.policyAmount) : 0,
      clientStatus: newCustomer.clientStatus || '',
      advisorNotes: newCustomer.advisorNotes || '',
      maritalStatus: newCustomer.maritalStatus || '',
      anniversaryDate: newCustomer.anniversaryDate || '',
      city: newCustomer.city || '',
      assignedAdvisorName: newCustomer.assignedAdvisorName || user?.name || 'Priya Sharma',
      status: 'Active',
      familyMembers: newCustomer.familyMembers || [],
      activePortfolios: []
    };

    await addCustomer(createdObj);
    setShowAddModal(false);
    alert(`Customer "${createdObj.name}" created and saved to database!`);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type "DELETE" to confirm deletion.');
      return;
    }
    try {
      await deleteCustomer(customerToDelete.id);
      if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      alert(`Customer "${customerToDelete.name}" (${customerToDelete.id}) permanently deleted from database.`);
      setCustomerToDelete(null);
      setDeleteConfirmText('');
    } catch (err) {
      alert(`Error deleting customer: ${err.message}`);
    }
  };

  const handleAddFamilyMember = (e) => {
    e.preventDefault();
    if (!newFamilyMember.name) {
      alert('Please fill in Family Member Name');
      return;
    }

    const createdMember = {
      id: 'FM-' + Math.floor(1000 + Math.random() * 9000),
      name: newFamilyMember.name,
      relation: newFamilyMember.relation,
      gender: newFamilyMember.gender,
      dob: newFamilyMember.dob,
      anniversaryDate: newFamilyMember.relation === 'Spouse' ? newFamilyMember.anniversaryDate : '',
      phone: newFamilyMember.phone
    };

    if (selectedCustomer) {
      const updatedCust = {
        ...selectedCustomer,
        familyMembers: [...(selectedCustomer.familyMembers || []), createdMember]
      };
      setSelectedCustomer(updatedCust);
      updateCustomer(updatedCust);
    } else {
      setNewCustomer({
        ...newCustomer,
        familyMembers: [...newCustomer.familyMembers, createdMember]
      });
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

  const handleSaveEditCustomer = (e) => {
    e.preventDefault();
    if (!editCustomerData) return;

    updateCustomer(editCustomerData);

    if (selectedCustomer && selectedCustomer.id === editCustomerData.id) {
      setSelectedCustomer(editCustomerData);
    }
    setShowEditModal(false);
    setEditCustomerData(null);
    alert(`Customer 360 profile (${editCustomerData.customerCode || editCustomerData.id}) updated successfully across CRM!`);
  };

  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER';

  const isAssignedToStaff = (c) => {
    if (!isStaffAdvisor) return true; // Admin and Manager see all customers
    if (!user || !user.name) return true;

    const activeName = user.name.toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];
    const activeEmail = (user.email || '').toLowerCase().trim();

    const assignedName = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || '').toLowerCase().trim();
    const assignedEmail = (c.assignedStaffEmail || c.advisorEmail || '').toLowerCase().trim();

    if (assignedName && (assignedName === activeName || assignedName.split(' ')[0] === activeFirst)) return true;
    if (assignedEmail && activeEmail && assignedEmail === activeEmail) return true;
    if (c.staffId && c.staffId === user.uid) return true;

    // Fallback: If customer has no advisor assigned yet, show to staff so staff can view/manage
    if (!assignedName && !assignedEmail && !c.staffId) return true;

    return false;
  };

  const handleColFilterChange = (field, val) => {
    setColFilters(prev => ({ ...prev, [field]: val }));
  };

  const clearAllColFilters = () => {
    setColFilters({
      date: '',
      clientCategory: 'ALL',
      name: '',
      phone: '',
      assignedStaff: 'ALL',
      insurer: '',
      salesPitch: '',
      clientStatus: 'ALL',
      advisorNotes: ''
    });
  };

  const filtered = customers.filter(c => {
    // Restrict staff view to assigned clients only
    if (!isAssignedToStaff(c)) return false;

    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.insuranceCompany && c.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.salesPitch && c.salesPitch.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.advisorNotes && c.advisorNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMarital === 'MARRIED' && c.maritalStatus !== 'Married') return false;
    if (filterMarital === 'SINGLE' && c.maritalStatus !== 'Single') return false;

    // Column level filters
    if (colFilters.date && !(c.date || '').toLowerCase().includes(colFilters.date.toLowerCase())) return false;
    if (colFilters.clientCategory !== 'ALL' && (c.clientCategory || 'New Lead') !== colFilters.clientCategory) return false;
    if (colFilters.name && !(c.name || '').toLowerCase().includes(colFilters.name.toLowerCase())) return false;
    if (colFilters.phone && !(c.phone || '').includes(colFilters.phone)) return false;
    if (colFilters.assignedStaff !== 'ALL' && (c.assignedAdvisorName || 'Priya Sharma') !== colFilters.assignedStaff) return false;
    if (colFilters.insurer && !(c.insuranceCompany || '').toLowerCase().includes(colFilters.insurer.toLowerCase())) return false;
    if (colFilters.salesPitch && !(c.salesPitch || '').toLowerCase().includes(colFilters.salesPitch.toLowerCase())) return false;
    if (colFilters.clientStatus !== 'ALL' && (c.clientStatus || 'Quotation Shared') !== colFilters.clientStatus) return false;
    if (colFilters.advisorNotes && !(c.advisorNotes || '').toLowerCase().includes(colFilters.advisorNotes.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Download Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isStaffAdvisor ? 'My Assigned Client Portfolios' : 'Customer 360° Directory'}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            {isStaffAdvisor ? 'Showing client portfolios assigned to your staff profile.' : 'Complete master client directory with linked policies, family profiles, claims & holdings.'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2.5">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <>
              <button 
                onClick={() => exportFollowupsPDF(filtered)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Report</span>
              </button>

              <button 
                onClick={() => exportFollowupsExcel(filtered)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Marital Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Customer Name, Phone, Email, PAN or City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button 
            onClick={() => setFilterMarital('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${filterMarital === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Customers
          </button>
          <button 
            onClick={() => setFilterMarital('MARRIED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${filterMarital === 'MARRIED' ? 'bg-pink-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            💍 Married
          </button>
          <button 
            onClick={() => setFilterMarital('SINGLE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${filterMarital === 'SINGLE' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            👤 Single
          </button>
        </div>
      </div>

      {/* Customer Registry Table (Matching Sample Spreadsheet Structure) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="p-3.5 border-r border-slate-800">Date</th>
                <th className="p-3.5 border-r border-slate-800">Client Category</th>
                <th className="p-3.5 border-r border-slate-800">Client Name</th>
                <th className="p-3.5 border-r border-slate-800">Mobile Number</th>
                <th className="p-3.5 border-r border-slate-800">Present Handling Staff</th>
                <th className="p-3.5 border-r border-slate-800">Active Policy &amp; Insurer</th>
                <th className="p-3.5 border-r border-slate-800">Sales Pitch</th>
                <th className="p-3.5 border-r border-slate-800">Client Status</th>
                <th className="p-3.5 border-r border-slate-800">Advisor Notes</th>
                <th className="p-3.5 text-center">360° Profile</th>
              </tr>
              {/* Interactive Column Filters Row */}
              <tr className="bg-slate-850 border-b border-slate-700">
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="date" 
                    value={colFilters.date} 
                    onChange={(e) => handleColFilterChange('date', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-amber-300 rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-bold cursor-pointer" 
                    title="Select Date to Filter"
                  />
                </th>
                <th className="p-2 border-r border-slate-700">
                  <select 
                    value={colFilters.clientCategory} 
                    onChange={(e) => handleColFilterChange('clientCategory', e.target.value)} 
                    className="w-full px-1.5 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none font-bold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="New Lead">New Lead 🔵</option>
                    <option value="Existing Lead">Existing Lead 🟣</option>
                    <option value="VIP Client">VIP Client ⭐</option>
                  </select>
                </th>
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="text" 
                    placeholder="🔍 Filter Name..." 
                    value={colFilters.name} 
                    onChange={(e) => handleColFilterChange('name', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-medium placeholder-slate-400" 
                  />
                </th>
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="text" 
                    placeholder="📞 Filter Phone..." 
                    value={colFilters.phone} 
                    onChange={(e) => handleColFilterChange('phone', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-mono font-medium placeholder-slate-400" 
                  />
                </th>
                <th className="p-2 border-r border-slate-700">
                  <select 
                    value={colFilters.assignedStaff} 
                    onChange={(e) => handleColFilterChange('assignedStaff', e.target.value)} 
                    className="w-full px-1.5 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none font-bold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Staff</option>
                    {staffList.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
                  </select>
                </th>
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="text" 
                    placeholder="🛡️ Filter Insurer..." 
                    value={colFilters.insurer} 
                    onChange={(e) => handleColFilterChange('insurer', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-medium placeholder-slate-400" 
                  />
                </th>
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="text" 
                    placeholder="📊 Filter Pitch..." 
                    value={colFilters.salesPitch} 
                    onChange={(e) => handleColFilterChange('salesPitch', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-medium placeholder-slate-400" 
                  />
                </th>
                <th className="p-2 border-r border-slate-700">
                  <select 
                    value={colFilters.clientStatus} 
                    onChange={(e) => handleColFilterChange('clientStatus', e.target.value)} 
                    className="w-full px-1.5 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none font-bold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Quotation Shared">Quotation Shared</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Interested">Interested</option>
                    <option value="Closed">Closed</option>
                    <option value="Active">Active</option>
                  </select>
                </th>
                <th className="p-2 border-r border-slate-700">
                  <input 
                    type="text" 
                    placeholder="📝 Filter Notes..." 
                    value={colFilters.advisorNotes} 
                    onChange={(e) => handleColFilterChange('advisorNotes', e.target.value)} 
                    className="w-full px-2 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-[10px] outline-none focus:border-blue-500 font-medium placeholder-slate-400" 
                  />
                </th>
                <th className="p-2 text-center">
                  <button 
                    onClick={clearAllColFilters} 
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase transition cursor-pointer shadow-2xs"
                    title="Reset all column filters"
                  >
                    Reset
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
              {filtered.length > 0 ? (
                filtered.map((c, idx) => {
                  const isHealth = c.insuranceType === 'HEALTH';
                  return (
                    <tr 
                      key={c.id || idx} 
                      className={`transition hover:bg-blue-50/60 ${isHealth ? 'bg-orange-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200/80 font-mono">{c.date || '4-Aug-26'}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className={`badge text-[10px] ${c.clientCategory === 'New Lead' ? 'bg-blue-100 text-blue-800 font-extrabold' : 'bg-purple-100 text-purple-800 font-extrabold'}`}>
                          {c.clientCategory || 'New Lead'}
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(c);
                            setActive360Tab('OVERVIEW');
                          }}
                          className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                          title="Click to view Customer 360° Profile"
                        >
                          <span>{c.name}</span>
                          <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                        </button>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200/80">{c.phone}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className="badge bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2.5 py-1 rounded-lg inline-flex items-center space-x-1 shadow-2xs">
                          <UserCheck className="h-3 w-3 text-purple-700 shrink-0" />
                          <span>{c.assignedAdvisorName || 'Priya Sharma'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <p className="font-extrabold text-blue-900 flex items-center space-x-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{c.insuranceCompany || 'Tata AIA Life'}</span>
                        </p>
                        <span className={`badge text-[10px] font-black mt-1 ${isHealth ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {c.insuranceType || 'LIFE'} Policy
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 border-r border-slate-200/80">{c.salesPitch || 'Retirement Plan'}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className="badge bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                          {c.clientStatus || 'Quotation Shared'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 italic font-medium border-r border-slate-200/80">{c.advisorNotes || 'Quote shared'}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedCustomer(c);
                              setActive360Tab('OVERVIEW');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1"
                          >
                            <span>View 360°</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToDelete(c);
                              setDeleteConfirmText('');
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer border border-rose-200"
                            title="Delete Customer Profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-xs text-slate-400">
                    No customer records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CUSTOMER 360 DEGREE PROFILE MODAL ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                      Code: {selectedCustomer.customerCode}
                    </span>
                    <span className={`badge text-[10px] font-extrabold ${selectedCustomer.maritalStatus === 'Married' ? 'bg-pink-500 text-white' : 'bg-purple-600 text-white'}`}>
                      {selectedCustomer.maritalStatus === 'Married' ? '💍 Married' : '👤 Single'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-100 mt-1 flex-wrap">
                    <span>{selectedCustomer.gender || 'Male'}</span>
                    <span>•</span>
                    <span>{selectedCustomer.city}</span>
                    <span>•</span>
                    <span>Active Follow-up Staff: <strong className="text-amber-300 font-extrabold">{selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</strong></span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCustomer(null)}
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
                <span>Insurance Policies</span>
              </button>

              <button 
                onClick={() => setActive360Tab('CLAIMS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'CLAIMS' ? 'bg-white text-amber-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Claims History</span>
              </button>

              <button 
                onClick={() => setActive360Tab('RENEWALS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'RENEWALS' ? 'bg-white text-rose-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Policy Renewals</span>
              </button>

              <button 
                onClick={() => setActive360Tab('PORTFOLIO')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'PORTFOLIO' ? 'bg-white text-purple-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <IndianRupee className="h-3.5 w-3.5" />
                <span>Holdings &amp; SIPs</span>
              </button>

              <button 
                onClick={() => setActive360Tab('TASKS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${active360Tab === 'TASKS' ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Follow-ups &amp; Notes</span>
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
                        <h4 className="text-base font-black text-slate-900 mt-0.5">{selectedCustomer.assignedAdvisorName || 'Priya Sharma (Senior Advisor)'}</h4>
                        <span className="text-[11px] font-extrabold text-purple-700">Actively Following Up Client</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4.5 rounded-2xl border border-blue-200/80 flex items-center space-x-3.5 shadow-xs">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Present Active Policy &amp; Plan</span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">{selectedCustomer.insuranceCompany || 'Tata AIA Life'} ({selectedCustomer.insuranceType || 'LIFE'})</h4>
                        <span className="text-[11px] font-extrabold text-blue-700">Plan: {selectedCustomer.salesPitch || 'Savings / Retirement Plan'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
                      <span className="text-[10px] font-black uppercase text-blue-600 block">Total Active Policies</span>
                      <p className="text-xl font-black text-slate-900 mt-1">1 Policy</p>
                      <span className="text-[10px] font-extrabold text-blue-700">{selectedCustomer.insuranceCompany || 'Tata AIA Life'}</span>
                    </div>
                    <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                      <span className="text-[10px] font-black uppercase text-amber-600 block">Total Claims Filed</span>
                      <p className="text-xl font-black text-slate-900 mt-1">1 Settled</p>
                      <span className="text-[10px] font-extrabold text-amber-700">₹ 1,85,000 Settled</span>
                    </div>
                    <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">Active Holdings</span>
                      <p className="text-xl font-black text-slate-900 mt-1">₹ 50,000 / yr</p>
                      <span className="text-[10px] font-extrabold text-emerald-700">Savings Plan</span>
                    </div>
                    <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-black uppercase text-purple-600 block">Assigned Staff</span>
                      <p className="text-sm font-black text-slate-900 mt-1 truncate">{selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</p>
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
                        <p className="text-xs font-extrabold text-slate-900">{selectedCustomer.dob || '1982-01-11'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                        <p className="text-xs font-extrabold text-slate-900">{selectedCustomer.gender || 'Male'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Occupation</span>
                        <p className="text-xs font-extrabold text-slate-900 truncate">{selectedCustomer.occupation || 'Executive'}</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Annual Income</span>
                        <p className="text-xs font-extrabold text-emerald-700">{selectedCustomer.incomeBracket || '25-50 Lakhs'}</p>
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
                          <span>Mobile: {selectedCustomer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>Email: {selectedCustomer.email || `${selectedCustomer.name?.toLowerCase().replace(/\s+/g, '')}@example.com`}</span>
                        </div>
                        <div className="flex items-start space-x-2 text-slate-600 font-bold text-xs">
                          <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>Address: {selectedCustomer.address || selectedCustomer.city}</span>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pink-50/70 p-4 rounded-2xl border border-pink-100">
                    <div>
                      <h4 className="text-xs font-black uppercase text-pink-700 tracking-wider flex items-center space-x-1.5">
                        <Users className="h-4 w-4 text-pink-600" />
                        <span>Registered Family Members Directory</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">Structured tabular view for spouse, children, parents birthdays &amp; anniversaries.</p>
                    </div>

                    <button 
                      onClick={() => setShowAddFamilyModal(true)}
                      className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Family Member</span>
                    </button>
                  </div>

                  {/* Family Members Tabular Columns */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center">S.No</th>
                          <th className="p-3">Member Name</th>
                          <th className="p-3">Relationship</th>
                          <th className="p-3">Gender</th>
                          <th className="p-3">Age / Date of Birth</th>
                          <th className="p-3">Contact Number</th>
                          <th className="p-3">Wedding Anniversary</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {selectedCustomer.familyMembers && selectedCustomer.familyMembers.length > 0 ? (
                          selectedCustomer.familyMembers.map((fm, idx) => (
                            <tr key={idx} className="hover:bg-pink-50/40 transition">
                              <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-black flex items-center justify-center text-xs shrink-0">
                                  {fm.name?.charAt(0)}
                                </div>
                                <span>{fm.name}</span>
                              </td>
                              <td className="p-3">
                                <span className="badge bg-pink-100 text-pink-800 font-extrabold text-[10px]">
                                  {fm.relation === 'Other' ? (fm.relationshipName || 'Other Relative') : fm.relation}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">{fm.gender || (fm.relation === 'Spouse' || fm.relation === 'Mother' || fm.relation === 'Daughter' || fm.relation === 'Sister' ? 'Female' : 'Male')}</td>
                              <td className="p-3 font-mono font-bold text-slate-800">
                                {fm.dob || 'N/A'}
                              </td>
                              <td className="p-3 font-mono text-slate-600">{fm.phone || 'N/A'}</td>
                              <td className="p-3 font-mono font-bold text-pink-700">
                                {fm.anniversaryDate ? (
                                  <span className="flex items-center space-x-1">
                                    <Heart className="h-3 w-3 text-pink-500 fill-pink-500 shrink-0" />
                                    <span>{fm.anniversaryDate}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className="badge badge-green text-[10px]">Active</span>
                              </td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => {
                                    const updatedFM = selectedCustomer.familyMembers.filter((_, i) => i !== idx);
                                    const updatedCust = { ...selectedCustomer, familyMembers: updatedFM };
                                    setSelectedCustomer(updatedCust);
                                    setCustomers(customers.map(c => c.id === updatedCust.id ? updatedCust : c));
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                  title="Remove Member"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="p-8 text-center bg-slate-50">
                              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-600">No family members registered yet.</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Family Member" above to record spouse, children, or parents in columns!</p>
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
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Customer Insurance Contracts</h4>
                    <span className="badge bg-blue-100 text-blue-800 text-[10px] font-extrabold">Active Coverage</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Policy No &amp; Insurer</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Sum Assured</th>
                          <th className="p-3">Annual Premium</th>
                          <th className="p-3">Assigned Staff / Officer</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {selectedCustomer.insuranceCompany ? (
                          <tr className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-extrabold text-slate-900">{selectedCustomer.insuranceCompany}</p>
                              <p className="text-[10px] font-mono text-slate-400">{selectedCustomer.id || 'POL-REG-01'}</p>
                            </td>
                            <td className="p-3"><span className="badge badge-brand text-[10px]">{selectedCustomer.insuranceType || 'Active'}</span></td>
                            <td className="p-3 font-extrabold text-slate-900">{selectedCustomer.salesPitch || 'Registered Plan'}</td>
                            <td className="p-3 font-mono font-bold text-emerald-700">{selectedCustomer.policyAmount ? `₹ ${Number(selectedCustomer.policyAmount).toLocaleString()} / yr` : '₹ 0.00'}</td>
                            <td className="p-3">
                              <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                👤 {selectedCustomer.assignedAdvisorName || 'Assigned Staff'}
                              </span>
                            </td>
                            <td className="p-3"><span className="badge badge-green text-[10px]">ACTIVE</span></td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-slate-400 font-semibold">No insurance policy contracts attached to this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: CLAIMS HISTORY */}
              {active360Tab === 'CLAIMS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Claims &amp; Hospitalization History</h4>
                    <span className="badge bg-amber-100 text-amber-800 text-[10px] font-extrabold">Help Desk Assistance</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Claim ID &amp; Policy</th>
                          <th className="p-3">Insurer Company</th>
                          <th className="p-3">Claim Amount</th>
                          <th className="p-3">Claim Date</th>
                          <th className="p-3">Assigned Staff / Officer</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {selectedCustomer.claims && selectedCustomer.claims.length > 0 ? (
                          selectedCustomer.claims.map((clm, cIdx) => (
                            <tr key={cIdx} className="hover:bg-slate-50">
                              <td className="p-3">
                                <p className="font-extrabold text-slate-900">{clm.id || `CLM-${cIdx}`}</p>
                                <p className="text-[10px] font-mono text-slate-400">{selectedCustomer.id || 'POL-REG-01'}</p>
                              </td>
                              <td className="p-3 font-bold text-slate-800">{clm.insuranceCompany || selectedCustomer.insuranceCompany || 'Provider'}</td>
                              <td className="p-3 font-mono font-black text-slate-900">₹ {Number(clm.amount || 0).toLocaleString()}</td>
                              <td className="p-3 text-slate-600">{clm.date || 'Recent'}</td>
                              <td className="p-3">
                                <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                  👤 {clm.assignedStaff || 'Claims Officer'}
                                </span>
                              </td>
                              <td className="p-3"><span className="badge badge-green text-[10px]">{clm.status || 'SETTLED'}</span></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-slate-400 font-semibold">No claims history filed for this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: POLICY RENEWALS */}
              {active360Tab === 'RENEWALS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Upcoming &amp; Past Renewals Schedule</h4>
                    <span className="badge bg-rose-100 text-rose-800 text-[10px] font-extrabold">Reminder Notices</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Policy No</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Renewal Premium</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3">Assigned Follow-up Officer</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {selectedCustomer.insuranceCompany ? (
                          <tr className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-extrabold text-slate-900">{selectedCustomer.id || 'POL-REG-01'}</td>
                            <td className="p-3 font-bold text-slate-800">{selectedCustomer.insuranceType || 'Active Coverage'}</td>
                            <td className="p-3 font-mono font-black text-emerald-700">{selectedCustomer.policyAmount ? `₹ ${Number(selectedCustomer.policyAmount).toLocaleString()}` : '₹ 0.00'}</td>
                            <td className="p-3 font-bold text-rose-600">{selectedCustomer.dueDate || 'Annual Renewal'}</td>
                            <td className="p-3">
                              <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                👤 {selectedCustomer.assignedAdvisorName || 'Assigned Staff'}
                              </span>
                            </td>
                            <td className="p-3"><span className="badge badge-red text-[10px]">ACTIVE TRACK</span></td>
                          </tr>
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

              {/* TAB 6: PORTFOLIOS & HOLDINGS */}
              {active360Tab === 'PORTFOLIO' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-3">Active Investment Holdings &amp; Portfolios</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Product Category</th>
                            <th className="p-3">Provider &amp; Scheme</th>
                            <th className="p-3">Premium / SIP Amount</th>
                            <th className="p-3">Folio / Policy #</th>
                            <th className="p-3">Assigned Advisor</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {selectedCustomer.activePortfolios && selectedCustomer.activePortfolios.length > 0 ? (
                            selectedCustomer.activePortfolios.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 font-extrabold text-slate-900">{p.type}</td>
                                <td className="p-3 font-semibold text-slate-700">{p.provider}</td>
                                <td className="p-3 font-bold text-emerald-700">{p.amount}</td>
                                <td className="p-3 font-mono text-slate-600">{p.folio}</td>
                                <td className="p-3">
                                  <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                    👤 {selectedCustomer.assignedAdvisorName || 'Priya Sharma'}
                                  </span>
                                </td>
                                <td className="p-3"><span className="badge badge-green text-[10px]">Active</span></td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-4 text-center text-slate-400">No active investment holdings logged.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: TASKS & FOLLOW-UP LOGS */}
              {active360Tab === 'TASKS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Advisor Follow-up History &amp; Log Notes</h4>
                    <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">Active Interactions</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-black text-slate-900">Current Client Status: {selectedCustomer.clientStatus || 'Quotation Shared'}</span>
                      <span className="text-[11px] font-bold text-slate-500">Date: {selectedCustomer.date || '04-Aug-26'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sales Pitch &amp; Proposal</span>
                      <p className="text-xs font-bold text-slate-800">{selectedCustomer.salesPitch || 'Savings / Retirement Plan'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Advisor Notes &amp; Call Logs</span>
                      <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200">"{selectedCustomer.advisorNotes || 'Quote shared with client over phone and email.'}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-600">Handling Follow-up Officer: <strong>{selectedCustomer.assignedAdvisorName || 'Priya Sharma'}</strong></span>
                      <span className="badge badge-brand text-[10px]">Active Lead</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions (Redundant close button removed) */}
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
                  <span>Edit Profile</span>
                </button>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <button 
                    onClick={() => exportCustomer360PDF(selectedCustomer)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export 360 Profile (PDF)</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= ADD NEW CUSTOMER MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Customer 360 Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Full Customer Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustomer.name} 
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Phone Mobile</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+91 98765 43210"
                    value={newCustomer.phone} 
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="ramesh@example.com"
                    value={newCustomer.email} 
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              {/* MARITAL STATUS & ANNIVERSARY OPTION */}
              <div className="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-pink-700 mb-1">Marital Status</label>
                    <select 
                      value={newCustomer.maritalStatus}
                      onChange={(e) => setNewCustomer({...newCustomer, maritalStatus: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married 💍</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={newCustomer.dob} 
                      onChange={(e) => setNewCustomer({...newCustomer, dob: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                    />
                  </div>
                </div>

                {/* Show Anniversary Date Input ONLY if Married */}
                {newCustomer.maritalStatus === 'Married' && (
                  <div className="pt-2 border-t border-pink-200/60 animate-fadeIn">
                    <label className="block text-[11px] font-black uppercase text-pink-800 mb-1 flex items-center space-x-1">
                      <Heart className="h-3.5 w-3.5 fill-pink-600 text-pink-600" />
                      <span>Wedding Anniversary Date</span>
                    </label>
                    <input 
                      type="date" 
                      value={newCustomer.anniversaryDate} 
                      onChange={(e) => setNewCustomer({...newCustomer, anniversaryDate: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs outline-none focus:ring-2 focus:ring-pink-500 bg-white font-bold" 
                    />
                  </div>
                )}
              </div>

              {/* FAMILY MEMBERS SECTION */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-700">Family Members ({newCustomer.familyMembers.length})</span>
                  <button 
                    type="button"
                    onClick={() => setShowAddFamilyModal(true)}
                    className="text-[11px] font-extrabold text-pink-600 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Spouse / Child</span>
                  </button>
                </div>

                {newCustomer.familyMembers.length > 0 && (
                  <div className="space-y-1.5">
                    {newCustomer.familyMembers.map((fm, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{fm.name}</strong> <span className="text-slate-400">({fm.relation})</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{fm.dob ? `DOB: ${fm.dob}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">PAN Card</label>
                  <input 
                    type="text" 
                    placeholder="ABCDE1234F"
                    value={newCustomer.pan} 
                    onChange={(e) => setNewCustomer({...newCustomer, pan: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Aadhaar / UIDAI</label>
                  <input 
                    type="text" 
                    placeholder="xxxx-xxxx-9999"
                    value={newCustomer.aadhaar} 
                    onChange={(e) => setNewCustomer({...newCustomer, aadhaar: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">City / Region</label>
                  <input 
                    type="text" 
                    placeholder="Mumbai"
                    value={newCustomer.city} 
                    onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff Advisor</label>
                  <select 
                    value={newCustomer.assignedAdvisorName || 'Priya Sharma'} 
                    onChange={(e) => setNewCustomer({...newCustomer, assignedAdvisorName: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer" 
                  >
                    {staffList.map((st, idx) => (
                      <option key={idx} value={st.name}>{st.name} ({st.role || 'Staff'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION: ACTIVE POLICY & INSURER DETAILS */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Active Policy &amp; Insurer Details</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">Insurance Company / Insurer</label>
                    <select 
                      value={newCustomer.insuranceCompany} 
                      onChange={(e) => setNewCustomer({...newCustomer, insuranceCompany: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-extrabold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Tata AIA Life">Tata AIA Life 🛡️</option>
                      <option value="Star Health Insurance">Star Health Insurance 🏥</option>
                      <option value="HDFC ERGO Health">HDFC ERGO Health 💙</option>
                      <option value="Niva Bupa Health">Niva Bupa Health 🧡</option>
                      <option value="ICICI Prudential Life">ICICI Prudential Life 🏢</option>
                      <option value="LIC of India">LIC of India 🏦</option>
                      <option value="SBI Life Insurance">SBI Life Insurance 💚</option>
                      <option value="Max Life Insurance">Max Life Insurance ⭐</option>
                      <option value="Bajaj Allianz">Bajaj Allianz 🚗</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">Policy Type / Category</label>
                    <select 
                      value={newCustomer.insuranceType} 
                      onChange={(e) => setNewCustomer({...newCustomer, insuranceType: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="LIFE">Life Insurance (LIFE)</option>
                      <option value="HEALTH">Health / Medical (HEALTH)</option>
                      <option value="MOTOR">Motor / Vehicle (MOTOR)</option>
                      <option value="FIRE">Fire &amp; Asset Protection (FIRE)</option>
                      <option value="SIP">Mutual Fund SIP (SIP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Sales Pitch / Proposed Product</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Retirement Savings Plan" 
                      value={newCustomer.salesPitch} 
                      onChange={(e) => setNewCustomer({...newCustomer, salesPitch: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Client Pipeline Status</label>
                    <select 
                      value={newCustomer.clientStatus} 
                      onChange={(e) => setNewCustomer({...newCustomer, clientStatus: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Quotation Shared">Quotation Shared 📄</option>
                      <option value="Under Review">Under Review ⏳</option>
                      <option value="Interested">Interested 👍</option>
                      <option value="Active">Active Client ✅</option>
                      <option value="Closed">Closed / Converted 🎉</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Advisor Notes &amp; Observations</label>
                  <textarea 
                    rows="2"
                    placeholder="Enter notes about client requirements or pitch details..."
                    value={newCustomer.advisorNotes}
                    onChange={(e) => setNewCustomer({...newCustomer, advisorNotes: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Save Complete Customer 360 Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CUSTOMER 360 MODAL ================= */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Mobile Phone</label>
                    <input 
                      type="text"
                      required
                      value={editCustomerData.phone || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, phone: e.target.value, mobileNumber: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
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
                    <select 
                      value={editCustomerData.assignedAdvisorName || 'Priya Sharma'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, assignedAdvisorName: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-extrabold bg-white text-purple-900 outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                    >
                      {staffList.map((st, idx) => (
                        <option key={idx} value={st.name}>{st.name} ({st.role || 'Staff'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Type</label>
                    <select 
                      value={editCustomerData.insuranceType || 'LIFE'}
                      onChange={(e) => setEditCustomerData({...editCustomerData, insuranceType: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="LIFE">LIFE Insurance</option>
                      <option value="HEALTH">HEALTH Insurance</option>
                      <option value="MOTOR">MOTOR Insurance</option>
                      <option value="GENERAL">GENERAL Insurance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Tata AIA Life / Niva Bupa / Star Health"
                      value={editCustomerData.insuranceCompany || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, insuranceCompany: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-extrabold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sales Pitch / Product Plan</label>
                    <input 
                      type="text"
                      placeholder="e.g. Savings Plan / Re-Assure 3.0"
                      value={editCustomerData.salesPitch || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, salesPitch: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                      placeholder="e.g. Call back tomorrow morning"
                      value={editCustomerData.advisorNotes || ''}
                      onChange={(e) => setEditCustomerData({...editCustomerData, advisorNotes: e.target.value})}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>
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

      {/* ================= ADD FAMILY MEMBER MODAL ================= */}
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
                    placeholder="e.g. Business Partner, Guardian, Friend"
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

      {/* ================= 2-STEP CONFIRMATION CUSTOMER DELETION MODAL ================= */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-base font-black text-slate-900">Step 1: Confirm Permanent Deletion</h3>
              </div>
              <button onClick={() => setCustomerToDelete(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-2">
              <p className="text-xs font-black text-rose-800 uppercase tracking-wider">⚠️ WARNING: PERMANENT DATA REMOVAL</p>
              <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                You are about to permanently delete customer <strong>"{customerToDelete.name}"</strong> ({customerToDelete.id || customerToDelete.customerCode}).
                This will clear their 360° record and remove them completely from the database.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700">
                Step 2: Type <span className="text-rose-600 font-mono font-black">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to enable confirmation"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-extrabold text-slate-900 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition cursor-pointer ${
                  deleteConfirmText.trim().toUpperCase() === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-300 opacity-60 cursor-not-allowed'
                }`}
              >
                🔥 PERMANENTLY DELETE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
