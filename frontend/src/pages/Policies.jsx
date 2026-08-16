import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { downloadPolicyCertificate } from '../utils/exportUtils';
import { FileText, Plus, Search, CheckCircle2, Edit3, Trash2, X, Shield, ShieldCheck, Download, Building2, Sparkles, UserCheck } from 'lucide-react';

export const Policies = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { policies, addPolicy } = useData();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Dynamic Insurance Companies List
  const [insuranceCompanies, setInsuranceCompanies] = useState(() => {
    const saved = localStorage.getItem('crm_v2_insurance_companies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      'Star Health Insurance',
      'HDFC ERGO General',
      'ICICI Lombard',
      'Tata AIA Life',
      'Niva Bupa Health',
      'Care Health Insurance',
      'LIC of India',
      'SBI General Insurance',
      'Max Life Insurance',
      'Bajaj Allianz General',
      'Aditya Birla Capital',
      'Reliance General Insurance'
    ];
  });

  const [newCompanyName, setNewCompanyName] = useState('');
  const [showManageCompaniesModal, setShowManageCompaniesModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // New Policy Form State
  const [newPolicy, setNewPolicy] = useState({
    customerName: '',
    insuranceCompany: '',
    customCompany: '',
    type: '',
    customType: '',
    sumInsured: 1000000,
    grossPremium: 25000,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '2027-08-08',
    assignedStaff: 'Priya Sharma (Senior Advisor)'
  });

  const saveCompaniesToStorage = (list) => {
    setInsuranceCompanies(list);
    localStorage.setItem('crm_v2_insurance_companies', JSON.stringify(list));
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    if (insuranceCompanies.includes(newCompanyName.trim())) {
      alert("This insurance company already exists in the registry!");
      return;
    }
    const updated = [...insuranceCompanies, newCompanyName.trim()];
    saveCompaniesToStorage(updated);
    setNewCompanyName('');
    alert(`Insurance Company "${newCompanyName.trim()}" added successfully!`);
  };

  const handleDeleteCompany = (compName) => {
    if (window.confirm(`Are you sure you want to remove "${compName}" from the insurance companies directory?`)) {
      const updated = insuranceCompanies.filter(c => c !== compName);
      saveCompaniesToStorage(updated);
    }
  };

  const handleIssuePolicy = (e) => {
    e.preventDefault();
    if (!newPolicy.customerName || !newPolicy.grossPremium) {
      alert('Please fill in Customer Name and Gross Premium');
      return;
    }

    const company = newPolicy.insuranceCompany === 'CUSTOM' ? newPolicy.customCompany : newPolicy.insuranceCompany;
    const category = newPolicy.type === 'CUSTOM' ? newPolicy.customType : newPolicy.type;

    const matchedStaff = staffList.find(s => s.name === newPolicy.assignedStaff || s.uid === newPolicy.assignedStaffId);
    const assignedStaffId = matchedStaff?.uid || newPolicy.assignedStaffId || user?.uid || 'UID-STF-1003';
    const assignedStaffName = matchedStaff?.name || newPolicy.assignedStaff || user?.name || 'Priya Sharma';

    const created = addPolicy({
      customerName: newPolicy.customerName,
      insuranceCompany: company,
      type: category,
      sumInsured: parseFloat(newPolicy.sumInsured),
      grossPremium: parseFloat(newPolicy.grossPremium),
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
      sumInsured: 1000000,
      grossPremium: 25000,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-08-08',
      assignedStaff: user?.name || 'Priya Sharma'
    });
    alert(`Policy ${created.id} issued successfully for ${created.customerName}! Assigned to ${assignedStaffName}.`);
  };

  const handleSaveEditPolicy = (e) => {
    e.preventDefault();
    if (!editingPolicy) return;

    const company = editingPolicy.insuranceCompany === 'CUSTOM' ? editingPolicy.customCompany : editingPolicy.insuranceCompany;
    const category = editingPolicy.type === 'CUSTOM' ? editingPolicy.customType : editingPolicy.type;

    const updatedObj = {
      ...editingPolicy,
      insuranceCompany: company,
      type: category,
      sumInsured: parseFloat(editingPolicy.sumInsured),
      grossPremium: parseFloat(editingPolicy.grossPremium)
    };

    setPoliciesList(policiesList.map(p => p.id === updatedObj.id ? updatedObj : p));
    setShowEditModal(false);
    setEditingPolicy(null);
    alert(`Policy ${updatedObj.id} updated successfully!`);
  };

  const handleDeletePolicy = (id) => {
    if (window.confirm(`Are you sure you want to delete policy ${id}?`)) {
      setPoliciesList(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredPolicies = policies.filter(pol =>
    pol.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pol.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pol.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pol.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Policies Register</h1>
          <p className="text-xs text-slate-500 font-semibold">Active Life, Health, Motor &amp; General Insurance contracts, company providers &amp; policy editing.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowManageCompaniesModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs shadow-xs border border-purple-200 transition cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-purple-600" />
            <span>Manage Companies ({insuranceCompanies.length})</span>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Policy No, Client Name, Insurer or Plan Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
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
                <th className="p-4">Sum Insured</th>
                <th className="p-4">Gross Premium</th>
                <th className="p-4">Validity</th>
                <th className="p-4">Assigned Staff / Officer</th>
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
                    <span className="badge badge-brand text-[10px] mt-1">{pol.type}</span>
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
                          customType: ''
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

      {/* ================= MANAGE INSURANCE COMPANIES MODAL ================= */}
      {showManageCompaniesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span>Insurance Companies Directory</span>
              </h3>
              <button onClick={() => setShowManageCompaniesModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Add New Company Form */}
            <form onSubmit={handleAddCompany} className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-600">Add New Insurance Company</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Max Life / Reliance General"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* Company List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border-t pt-3">
              <span className="text-[11px] font-black uppercase text-slate-500 block mb-1">Active Insurers ({insuranceCompanies.length})</span>
              {insuranceCompanies.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  <span className="flex items-center space-x-2">
                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>{comp}</span>
                  </span>

                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteCompany(comp)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Company"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowManageCompaniesModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition cursor-pointer"
              >
                Close Directory
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
              <h3 className="text-base font-black text-slate-900">Issue New Insurance Policy</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleIssuePolicy} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter Customer Name" 
                  value={newPolicy.customerName} 
                  onChange={(e) => setNewPolicy({...newPolicy, customerName: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                />
              </div>

              {/* Insurance Provider Selector + Custom Option */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Insurance Company Provider</label>
                <select 
                  value={newPolicy.insuranceCompany} 
                  onChange={(e) => setNewPolicy({...newPolicy, insuranceCompany: e.target.value})} 
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
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Category / Plan Type</label>
                <select 
                  value={newPolicy.type} 
                  onChange={(e) => setNewPolicy({...newPolicy, type: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Health Insurance">Health Insurance 🏥</option>
                  <option value="Term Life Insurance">Term Life Insurance 🛡️</option>
                  <option value="Motor Insurance">Motor Insurance 🚗</option>
                  <option value="Personal Accident">Personal Accident ⚡</option>
                  <option value="Commercial & Fire">Commercial &amp; Fire 🏢</option>
                  <option value="Travel Insurance">Travel Insurance ✈️</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sum Insured (₹ Coverage)</label>
                  <input 
                    type="number" 
                    required 
                    value={newPolicy.sumInsured} 
                    onChange={(e) => setNewPolicy({...newPolicy, sumInsured: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Annual Premium (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={newPolicy.grossPremium} 
                    onChange={(e) => setNewPolicy({...newPolicy, grossPremium: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" 
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
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Active Follow-up Officer</label>
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

            <form onSubmit={handleSaveEditPolicy} className="space-y-3">
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
                      setEditingPolicy({...editingPolicy, insuranceCompany: val, customCompany: ''});
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
                <input 
                  type="text"
                  required
                  value={editingPolicy.type}
                  onChange={(e) => setEditingPolicy({...editingPolicy, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Sum Insured (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingPolicy.sumInsured} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, sumInsured: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Gross Annual Premium (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingPolicy.grossPremium} 
                    onChange={(e) => setEditingPolicy({...editingPolicy, grossPremium: e.target.value})} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-amber-500" 
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
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Active Follow-up Officer</label>
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
