import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Building2, Save, Key, UserCheck, ShieldCheck } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrHigher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [settings, setSettings] = useState({
    companyName: 'SK SMART INVESTMENTS',
    tagline: 'Insurance and Investments Specialist',
    branchName: 'Kanchipuram Master Office HQ',
    branchCode: 'BR-KNM-001',
    theme: 'Light Clean',
    defaultCurrency: 'INR (₹)'
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('System settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 font-semibold">Workspace metadata, branch details, and default application preferences.</p>
      </div>

      {isAdminOrHigher && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 rounded-3xl text-white shadow-xl space-y-3 border border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Admin Master Passwords &amp; Staff Access Vault</h3>
                <p className="text-[11px] text-blue-200">View passwords, edit all user details, change roles, and reset credentials</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/users')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Open Password Vault</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">Company Name</label>
            <input 
              type="text" 
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">Branch Name</label>
              <input 
                type="text" 
                value={settings.branchName}
                onChange={(e) => setSettings({...settings, branchName: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">Branch Code (Single Branch V1)</label>
              <input 
                type="text" 
                disabled
                value={settings.branchCode}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-500 outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Application Preferences</span>
          </button>
        </form>
      </div>
    </div>
  );
};
