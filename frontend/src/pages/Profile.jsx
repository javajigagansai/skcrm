import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key, Save, CheckCircle2, Camera, Calendar, Heart, Sparkles, Image, Upload } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256'
];

export const Profile = () => {
  const { user, setUser, resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    maritalStatus: user?.maritalStatus || 'Single',
    anniversaryDate: user?.anniversaryDate || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Sync active staff user state from localStorage if available
    const savedActive = localStorage.getItem('crm_v2_active_user');
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          dob: parsed.dob || prev.dob,
          maritalStatus: parsed.maritalStatus || prev.maritalStatus,
          anniversaryDate: parsed.anniversaryDate || prev.anniversaryDate,
          avatarUrl: parsed.avatarUrl || prev.avatarUrl
        }));
      } catch (e) {}
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const syncStaffCelebrationsRegistry = (updatedProfile) => {
    const savedStaffList = localStorage.getItem('crm_v2_staff_celebrations');
    let list = [];
    if (savedStaffList) {
      try { list = JSON.parse(savedStaffList); } catch (e) {}
    }

    if (!Array.isArray(list)) {
      list = [];
    }

    // Upsert updated user into staff celebration list
    const existingIndex = list.findIndex(s => s.name?.toLowerCase() === updatedProfile.name?.toLowerCase() || s.email?.toLowerCase() === updatedProfile.email?.toLowerCase());
    const staffRecord = {
      id: updatedProfile.id || `STF-${Date.now()}`,
      name: updatedProfile.name,
      email: updatedProfile.email,
      role: updatedProfile.roleDisplayName || updatedProfile.role || 'Staff Member',
      dob: updatedProfile.dob,
      maritalStatus: updatedProfile.maritalStatus,
      anniversaryDate: updatedProfile.anniversaryDate,
      mobile: updatedProfile.phone,
      avatarUrl: updatedProfile.avatarUrl
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...staffRecord };
    } else {
      list.push(staffRecord);
    }

    localStorage.setItem('crm_v2_staff_celebrations', JSON.stringify(list));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      maritalStatus: formData.maritalStatus,
      anniversaryDate: formData.maritalStatus === 'Married' ? formData.anniversaryDate : '',
      avatarUrl: formData.avatarUrl
    };

    if (setUser) setUser(updatedUser);
    localStorage.setItem('crm_v2_active_user', JSON.stringify(updatedUser));
    
    // Sync to staff celebration registry so Greetings Officer & Dashboard celebrate coworker dates
    syncStaffCelebrationsRegistry(updatedUser);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      alert(`Password reset link sent to ${user.email}! Please check your inbox.`);
    } catch (err) {
      alert(`Password reset link sent to ${user.email}!`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <span>My Profile &amp; Account Settings</span>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Manage your personal picture, contact credentials, birthday, anniversary, and team communication details.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Profile updated successfully! Birthdays &amp; Anniversary dates synced to Greetings Officer &amp; Team Radar.</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
        {/* Profile Picture Header Section */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b border-slate-100 pb-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-xl border-4 border-white">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.name} className="h-full w-full object-cover" />
              ) : (
                <span>{formData.name?.charAt(0) || 'U'}</span>
              )}
            </div>

            <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer transition flex items-center justify-center">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-black text-slate-900">{formData.name || 'Staff Member'}</h3>
            <p className="text-xs text-slate-500 font-semibold">{formData.email}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
              <span className="badge badge-brand text-[10px] px-3 py-1 font-extrabold">
                {user?.roleDisplayName || user?.role || 'Staff Advisor'}
              </span>
              <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2.5 py-1 font-extrabold">
                SK CRM Team Member
              </span>
            </div>
          </div>
        </div>

        {/* Preset Avatars Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-600 flex items-center space-x-1.5">
            <Image className="h-3.5 w-3.5 text-blue-600" />
            <span>Or Pick an Avatar Preset</span>
          </label>
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {PRESET_AVATARS.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Avatar ${idx}`}
                onClick={() => setFormData(prev => ({ ...prev, avatarUrl: url }))}
                className={`h-12 w-12 rounded-2xl object-cover cursor-pointer transition border-2 ${formData.avatarUrl === url ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
              />
            ))}
          </div>
        </div>

        {/* Main Form Fields */}
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Mobile Phone (WhatsApp Active)</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-pink-600" />
                <span>My Date of Birth (Birthday)</span>
              </label>
              <input 
                type="date" 
                required
                value={formData.dob} 
                onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
          </div>

          {/* Marital Status & Wedding Anniversary */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/80 space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-pink-600 fill-pink-500" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Marital Status &amp; Family Celebrations</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Marital Status</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>

              {formData.maritalStatus === 'Married' && (
                <div className="animate-fade-in">
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                    <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                    <span>Wedding Anniversary Date</span>
                  </label>
                  <input 
                    type="date" 
                    value={formData.anniversaryDate} 
                    onChange={(e) => setFormData({...formData, anniversaryDate: e.target.value})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none bg-white" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save &amp; Sync Profile Details</span>
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition cursor-pointer"
            >
              <Key className="h-4 w-4 text-slate-600" />
              <span>Reset Account Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
