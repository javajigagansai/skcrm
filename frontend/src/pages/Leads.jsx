import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCustomer360 } from '../context/Customer360Context';
import { 
  Plus, Search, UserCheck, Flame, Zap, Shield, CheckCircle2, 
  ArrowRight, Phone, Mail, MapPin, Sparkles, Filter, X, Building2, UserPlus
} from 'lucide-react';

export const Leads = () => {
  const { user } = useAuth();
  const { leads, addLead, convertLeadToCustomer } = useData();
  const { openCustomer360 } = useCustomer360();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newLead, setNewLead] = useState({
    customerName: '',
    phone: '',
    email: '',
    productInterest: 'Health Insurance & SIP',
    leadSource: 'Website Inquiry',
    leadStatus: 'HOT',
    city: 'Chennai',
    assignedStaff: user?.name || 'Priya Sharma',
    estimatedValue: 50000
  });

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLead.customerName || !newLead.phone) {
      alert('Please provide Lead Name and Mobile Contact');
      return;
    }

    await addLead(newLead);
    setShowAddModal(false);
    setNewLead({
      customerName: '',
      phone: '',
      email: '',
      productInterest: 'Health Insurance & SIP',
      leadSource: 'Website Inquiry',
      leadStatus: 'HOT',
      city: 'Chennai',
      assignedStaff: user?.name || 'Priya Sharma',
      estimatedValue: 50000
    });
    alert(`Lead "${newLead.customerName}" registered successfully!`);
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.phone?.includes(searchTerm) ||
                          l.productInterest?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || l.leadStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);
  const hotLeadsCount = leads.filter(l => l.leadStatus === 'HOT').length;
  const convertedLeadsCount = leads.filter(l => l.leadStatus === 'CONVERTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leads &amp; Prospect Acquisition Hub</h1>
          <p className="text-xs text-slate-500 font-semibold">Track prospective clients, nurture sales pitches, and convert leads into active customers.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Lead</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Pipeline Leads</span>
          <p className="text-2xl font-black text-slate-900">{leads.length}</p>
          <span className="badge badge-brand text-[10px]">Active Lead Funnel</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hot High Priority Leads</span>
          <p className="text-2xl font-black text-rose-600">{hotLeadsCount}</p>
          <span className="badge bg-rose-100 text-rose-800 text-[10px] font-bold">Fast Track Closing</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Converted Clients</span>
          <p className="text-2xl font-black text-emerald-600">{convertedLeadsCount}</p>
          <span className="badge badge-green text-[10px]">Onboarded Customers</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pipeline Est. Value</span>
          <p className="text-2xl font-black text-indigo-700">₹ {(totalValue / 100000).toFixed(2)} Lakhs</p>
          <span className="badge bg-indigo-100 text-indigo-800 text-[10px] font-bold">Estimated Revenue</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search leads by name, phone, product interest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center space-x-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </span>
          {['ALL', 'HOT', 'WARM', 'COLD', 'CONVERTED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${filterStatus === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map(lead => (
          <div key={lead.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <button 
                  onClick={() => openCustomer360(lead.customerName)}
                  className="text-base font-black text-slate-900 hover:text-blue-600 transition cursor-pointer text-left flex items-center space-x-1.5"
                >
                  <span>{lead.customerName}</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </button>
                <p className="text-[11px] text-slate-400 font-semibold">{lead.city || 'India'} • Source: {lead.leadSource}</p>
              </div>
              <span className={`badge text-[10px] font-black uppercase ${
                lead.leadStatus === 'HOT' ? 'bg-rose-500 text-white' :
                lead.leadStatus === 'WARM' ? 'bg-amber-500 text-white' :
                lead.leadStatus === 'CONVERTED' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
              }`}>
                {lead.leadStatus}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs font-semibold">
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                <span>{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>{lead.email}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-slate-700">
                <Shield className="h-3.5 w-3.5 text-purple-600" />
                <span>Product Interest: <strong>{lead.productInterest}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Deal Value</span>
                <span className="text-sm font-black text-emerald-700">₹ {Number(lead.estimatedValue || 0).toLocaleString()}</span>
              </div>

              {lead.leadStatus !== 'CONVERTED' ? (
                <button
                  onClick={() => {
                    convertLeadToCustomer(lead.id);
                    alert(`Lead "${lead.customerName}" successfully converted into an Active Customer profile!`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1 shadow-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Convert to Customer</span>
                </button>
              ) : (
                <span className="badge badge-green text-[10px] font-bold">Onboarded</span>
              )}
            </div>
          </div>
        ))}

        {filteredLeads.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <UserCheck className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-700">No matching leads found</h3>
            <p className="text-xs text-slate-400">Click "Register New Lead" to create a new prospective sales lead.</p>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Register New Sales Prospect Lead</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newLead.customerName}
                  onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Contact *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="9876543210"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="ramesh@example.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Interest</label>
                  <input 
                    type="text" 
                    placeholder="Health / Mutual Funds"
                    value={newLead.productInterest}
                    onChange={(e) => setNewLead({ ...newLead, productInterest: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Priority Status</label>
                  <select 
                    value={newLead.leadStatus}
                    onChange={(e) => setNewLead({ ...newLead, leadStatus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white"
                  >
                    <option value="HOT">🔥 HOT (Immediate Followup)</option>
                    <option value="WARM">⚡ WARM (Interested)</option>
                    <option value="COLD">❄️ COLD (Exploratory)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Region</label>
                  <input 
                    type="text" 
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Value (₹)</label>
                  <input 
                    type="number" 
                    value={newLead.estimatedValue}
                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md">Register Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
