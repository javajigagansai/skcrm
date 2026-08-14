import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { Plus, Search, ShieldCheck, CheckCircle2, Clock, AlertCircle, X, UserCheck, Sparkles } from 'lucide-react';

export const Claims = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { claims, addClaim, updateClaimStatus } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newClaim, setNewClaim] = useState({
    policyNo: '',
    customerName: '',
    insuranceCompany: '',
    claimAmount: '',
    hospitalOrGarage: '',
    assignedStaff: user?.name || 'Priya Sharma'
  });

  const handleFileClaim = (e) => {
    e.preventDefault();
    if (!newClaim.customerName || !newClaim.policyNo) {
      alert("Please fill in Customer Name and Policy Number");
      return;
    }
    const created = addClaim({
      ...newClaim,
      claimAmount: parseFloat(newClaim.claimAmount || 0),
      assignedStaff: newClaim.assignedStaff || user?.name || 'Priya Sharma'
    });
    setShowAddModal(false);
    setNewClaim({ policyNo: '', customerName: '', insuranceCompany: '', claimAmount: '', hospitalOrGarage: '', assignedStaff: user?.name || '' });
    alert(`Claim ${created.id} submitted successfully!`);
  };

  const handleUpdateClaimStatus = (id, newStatus) => {
    updateClaimStatus(id, newStatus);
  };

  const filtered = claims.filter(c =>
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.policyNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Claims Assistance Desk</h1>
          <p className="text-xs text-slate-500 font-semibold">Track cashless hospitalization &amp; reimbursement claim settlements.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>File New Claim</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Claims Filed</span>
          <p className="text-2xl font-black text-slate-900">{claims.length}</p>
          <span className="badge badge-brand text-[10px]">Active Tracked Claims</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Claims Settlement Ratio</span>
          <p className="text-2xl font-black text-emerald-600">
            {claims.length > 0 ? `${((claims.filter(c => c.status === 'SETTLED').length / claims.length) * 100).toFixed(1)}%` : '0%'}
          </p>
          <span className="badge badge-green text-[10px]">Fast-Track Approval</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase">Total Settled Value</span>
          <p className="text-2xl font-black text-slate-900">
            ₹ {claims.filter(c => c.status === 'SETTLED').reduce((sum, c) => sum + (c.settlementAmount || 0), 0).toLocaleString()}
          </p>
          <span className="badge badge-purple text-[10px]">Disbursed to Clients</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Claim ID, Client Name or Policy No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Claim ID &amp; Policy</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Insurer</th>
                <th className="p-4">Claim Amount</th>
                <th className="p-4">Assigned Staff / Officer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-extrabold text-slate-900">
                    <p>{c.id}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{c.policyNo}</p>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openCustomer360(c.customerName)}
                      className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                      title="Click to view Customer 360° Profile"
                    >
                      <span>{c.customerName}</span>
                      <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                    </button>
                  </td>
                  <td className="p-4">{c.insuranceCompany}</td>
                  <td className="p-4 font-mono font-black text-slate-900">₹{c.claimAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-blue-600 shrink-0" />
                      <span>{c.assignedStaff || 'Karthik Subramanian (Claims Head)'}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${c.status === 'SETTLED' ? 'badge-green' : c.status === 'UNDER_PROCESS' ? 'badge-amber' : 'badge-brand'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select 
                      value={c.status} 
                      onChange={(e) => handleUpdateClaimStatus(c.id, e.target.value)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-200 bg-white"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_PROCESS">UNDER_PROCESS</option>
                      <option value="SETTLED">SETTLED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">File Insurance Claim Request</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Full Name</label>
                <input type="text" required placeholder="Enter Customer Name" value={newClaim.customerName} onChange={(e) => setNewClaim({...newClaim, customerName: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Policy Number</label>
                  <input type="text" required value={newClaim.policyNo} onChange={(e) => setNewClaim({...newClaim, policyNo: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Claim Amount (₹)</label>
                  <input type="number" required value={newClaim.claimAmount} onChange={(e) => setNewClaim({...newClaim, claimAmount: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff / Claims Officer</label>
                <select 
                  value={newClaim.assignedStaff} 
                  onChange={(e) => setNewClaim({...newClaim, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Karthik Subramanian (Claims Head)">Karthik Subramanian (Claims Head)</option>
                  <option value="Anitha S. (Claim Specialist)">Anitha S. (Claim Specialist)</option>
                  <option value="Priya Sharma (Senior Advisor)">Priya Sharma (Senior Advisor)</option>
                  <option value="Rajesh V. (Relationship Manager)">Rajesh V. (Relationship Manager)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow cursor-pointer">Submit Claim to Desk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
