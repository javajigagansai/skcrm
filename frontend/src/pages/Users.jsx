import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseClient';
import { 
  Plus, Search, Shield, Trash2, UserPlus, X, Key, Eye, EyeOff, Edit, 
  CheckCircle2, Lock, RefreshCw, Copy, UserCheck, Award, Sparkles, Building2, Phone 
} from 'lucide-react';

const INITIAL_USERS_SEED = [
  { uid: 'UID-STF-1001', name: 'Prakash Gajendiran', email: 'admin@sk-smart-investments.com', role: 'SUPER_ADMIN', password: 'Password@123', status: 'ACTIVE', phone: '9876543210', branch: 'Chennai Main Head Office' },
  { uid: 'UID-STF-1002', name: 'Branch Manager', email: 'manager@sk-smart-investments.com', role: 'MANAGER', password: 'Password@123', status: 'ACTIVE', phone: '9812345678', branch: 'Bangalore Regional Desk' },
  { uid: 'UID-STF-1003', name: 'Priya Sharma', email: 'priya.sharma@sk-smart-investments.com', role: 'EMPLOYEE', password: 'Password@123', status: 'ACTIVE', phone: '9988776655', branch: 'Chennai Main Head Office' }
];

export const Users = () => {
  const { user: activeUser } = useAuth();
  const isAdminOrHigher = activeUser?.role === 'SUPER_ADMIN' || activeUser?.role === 'ADMIN';

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy fake demo accounts if present
          const cleaned = parsed.filter(u => 
            !['Rahul Dravid', 'Kavita Menon', 'Greetings Officer', 'Anitha Selvam', 'Karthik Subramanian'].includes(u.name) &&
            !['rahul.d@sksmart.com', 'kavita.m@sksmart.com', 'wishes@sksmart.com', 'anitha.s@sksmart.com', 'karthik.s@sksmart.com'].includes(u.email)
          );
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {}
    }
    return INITIAL_USERS_SEED;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [editingStaff, setEditingStaff] = useState(null);
  const [resettingPasswordStaff, setResettingPasswordStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [copiedUid, setCopiedUid] = useState(null);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    password: 'Password@123',
    phone: '',
    branch: 'Chennai Main Head Office'
  });

  // Real-time synchronization to LocalStorage and broadcast event to all components
  useEffect(() => {
    try {
      localStorage.setItem('crm_v2_users_list', JSON.stringify(users));
      window.dispatchEvent(new Event('storage_users_updated'));
    } catch (e) {}
  }, [users]);

  // Listen to storage_users_updated event for instant synchronization from Staff Management
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('crm_v2_users_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage_users_updated', handleStorageUpdate);
    return () => window.removeEventListener('storage_users_updated', handleStorageUpdate);
  }, []);

  // Dynamically load remote users from Firestore and merge real-time
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnap = await getDocs(collection(db, 'users'));
        const list = [];
        querySnap.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() });
        });
        if (list.length > 0) {
          setUsers(prev => {
            const map = new Map(prev.map(u => [u.email, u]));
            list.forEach(u => map.set(u.email, { ...map.get(u.email), ...u }));
            const merged = Array.from(map.values());
            localStorage.setItem('crm_v2_users_list', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn("Firestore users load info:", err.message);
      }
    };
    fetchUsers();
  }, []);

  const syncUserToFirestore = async (userData) => {
    try {
      if (userData && userData.uid) {
        await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore user sync info:", e.message);
    }
  };

  const togglePasswordVisibility = (uid) => {
    setShowPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleCopyCredentials = (u) => {
    const text = `Email: ${u.email}\nPassword: ${u.password}`;
    navigator.clipboard.writeText(text);
    setCopiedUid(u.uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleStatusToggle = (uid, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const updated = { ...u, status: nextStatus };
        syncUserToFirestore(updated);
        return updated;
      }
      return u;
    }));
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email) {
      alert('Please fill in Staff Name and Email');
      return;
    }

    const newStaffMember = {
      uid: 'UID-STF-' + Math.floor(1000 + Math.random() * 9000),
      name: staffForm.name,
      email: staffForm.email,
      role: staffForm.role,
      password: staffForm.password || 'Password@123',
      phone: staffForm.phone || '9876543210',
      branch: staffForm.branch || 'Chennai Main Head Office',
      status: 'ACTIVE'
    };

    const updatedUsers = [newStaffMember, ...users];
    setUsers(updatedUsers);
    try {
      localStorage.setItem('crm_v2_users_list', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('storage_users_updated'));
    } catch (e) {}
    syncUserToFirestore(newStaffMember);

    setShowAddStaffModal(false);
    setStaffForm({
      name: '',
      email: '',
      role: 'EMPLOYEE',
      password: 'Password@123',
      phone: '',
      branch: 'Chennai Main Head Office'
    });
    alert(`New staff account for "${newStaffMember.name}" created successfully!\n\nEmail: ${newStaffMember.email}\nPassword: ${newStaffMember.password}`);
  };

  const handleSaveEditStaff = (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setUsers(prev => prev.map(u => {
      if (u.uid === editingStaff.uid) {
        syncUserToFirestore(editingStaff);
        return editingStaff;
      }
      return u;
    }));
    setEditingStaff(null);
    alert(`Staff member "${editingStaff.name}" profile & credentials updated live across the CRM!`);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!resettingPasswordStaff || !newPassword) return;
    setUsers(prev => prev.map(u => {
      if (u.uid === resettingPasswordStaff.uid) {
        const updated = { ...u, password: newPassword };
        syncUserToFirestore(updated);
        return updated;
      }
      return u;
    }));
    setResettingPasswordStaff(null);
    setNewPassword('');
    alert(`Password for "${resettingPasswordStaff.name}" updated to "${newPassword}"!`);
  };

  const handleRemoveStaff = async (uid, name) => {
    if (window.confirm(`Are you sure you want to permanently remove staff account "${name}"?`)) {
      setUsers(prev => prev.filter(u => u.uid !== uid));
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {}
      alert(`Staff member "${name}" removed successfully.`);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const name = u.name || '';
    const email = u.email || '';
    const role = u.role || '';
    const branch = u.branch || '';

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedRoleFilter !== 'ALL' && role !== selectedRoleFilter) return false;
    return true;
  });

  const handlePurgeFakeAccounts = () => {
    if (!window.confirm('Are you sure you want to remove fake demo accounts from the credentials vault?')) return;
    const cleanList = users.filter(u => 
      !['Rahul Dravid', 'Kavita Menon', 'Greetings Officer', 'Anitha Selvam', 'Karthik Subramanian'].includes(u.name) &&
      !['rahul.d@sksmart.com', 'kavita.m@sksmart.com', 'wishes@sksmart.com', 'anitha.s@sksmart.com', 'karthik.s@sksmart.com'].includes(u.email)
    );
    setUsers(cleanList);
    localStorage.setItem('crm_v2_users_list', JSON.stringify(cleanList));
    alert('Fake demo accounts purged! Only real active accounts remain in the vault.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="h-7 w-7 text-blue-600" />
            <span>User Management &amp; Role Permissions Portal</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Admin Master Control Desk to manage staff accounts, credentials, role assignments &amp; real-time system privileges.</p>
        </div>

        {isAdminOrHigher && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePurgeFakeAccounts}
              className="px-3.5 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-xs border border-rose-200 transition cursor-pointer"
              title="Remove fake sample demo accounts"
            >
              🧹 Purge Demo Accounts
            </button>

            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Create New Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* MASTER CREDENTIALS VAULT BANNER */}
      {isAdminOrHigher && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4 border border-blue-800">
          <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">🔑 Admin Master Credentials &amp; Passwords Vault</h3>
                <p className="text-[11px] text-blue-200 font-medium">Real-time active staff accounts. Click copy icon to duplicate login credentials.</p>
              </div>
            </div>
            <span className="badge bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">Real-Time Sync Active ⚡</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {users.map(u => (
              <div key={u.uid} className="bg-white/10 p-3.5 rounded-2xl border border-white/15 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-300 flex items-center space-x-1">
                    <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span>{u.name}</span>
                  </span>
                  <span className={`badge text-[9px] font-black ${
                    u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'bg-amber-400 text-slate-950' : 
                    u.role === 'MANAGER' ? 'bg-indigo-400 text-slate-950' : 'bg-blue-400/30 text-blue-200'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono truncate">{u.email}</p>
                <div className="pt-1.5 flex items-center justify-between border-t border-white/10">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Password:</span>
                  <span className="font-mono font-black text-emerald-400 text-xs">
                    {showPasswords[u.uid] ? u.password : '••••••••'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => togglePasswordVisibility(u.uid)} 
                      className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                      title={showPasswords[u.uid] ? "Hide Password" : "View Password"}
                    >
                      {showPasswords[u.uid] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button 
                      onClick={() => handleCopyCredentials(u)}
                      className="text-amber-300 hover:text-amber-200 p-1 rounded hover:bg-white/10 cursor-pointer flex items-center space-x-1"
                      title="Copy Credentials"
                    >
                      {copiedUid === u.uid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search staff by Name, Email, Role or Branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Staff Roles ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Branch Manager</option>
            <option value="EMPLOYEE">Staff Advisor</option>
            <option value="GREETINGS_OFFICER">Greetings Officer</option>
          </select>
        </div>
      </div>

      {/* Staff Master Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                <th className="p-4">Staff Member &amp; ID</th>
                <th className="p-4">Email &amp; Branch Desk</th>
                <th className="p-4">Password Credentials</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span>{u.name}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {u.uid}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-slate-900 font-bold">{u.email}</p>
                      <p className="text-[10px] text-slate-500 font-semibold flex items-center space-x-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-indigo-500" />
                        <span>{u.branch || 'Head Office'}</span>
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl max-w-fit font-mono font-bold text-slate-900 border border-slate-200">
                        <span>{showPasswords[u.uid] ? u.password : '••••••••'}</span>
                        <button 
                          onClick={() => togglePasswordVisibility(u.uid)} 
                          className="text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Toggle Password Visibility"
                        >
                          {showPasswords[u.uid] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'badge-amber' : 
                        u.role === 'MANAGER' ? 'badge-purple' : 'badge-blue'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{u.status}</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isAdminOrHigher && (
                        <>
                          <button 
                            onClick={() => setEditingStaff({ ...u })}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-extrabold text-[11px] cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                            title="Edit Staff Member & Role"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit Staff</span>
                          </button>

                          <button 
                            onClick={() => { setResettingPasswordStaff(u); setNewPassword(''); }}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-extrabold text-[11px] cursor-pointer inline-flex items-center space-x-1"
                            title="Reset Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                            <span>Reset Password</span>
                          </button>

                          <button 
                            onClick={() => handleStatusToggle(u.uid, u.status)}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer ${u.status === 'ACTIVE' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>

                          {u.uid !== activeUser?.uid && (
                            <button 
                              onClick={() => handleRemoveStaff(u.uid, u.name)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] cursor-pointer inline-flex items-center space-x-1"
                              title="Remove Staff Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-slate-400 font-semibold">
                    No staff members match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE NEW STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Create New Staff Account</span>
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Full Name</label>
                <input 
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  placeholder="e.g. Vikramaditya Reddiyar"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Email Address (Login Username)</label>
                <input 
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                  placeholder="e.g. vikram.r@sksmart.com"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Assigned System Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white"
                >
                  <option value="EMPLOYEE">Staff Advisor (Scoped Client View)</option>
                  <option value="MANAGER">Branch Manager (Branch View)</option>
                  <option value="ADMIN">System Admin (Full Access)</option>
                  <option value="GREETINGS_OFFICER">Greetings Officer (Special Days Desk)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Initial Login Password</label>
                <input 
                  type="text"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Assigned Branch / Location</label>
                <input 
                  type="text"
                  value={staffForm.branch}
                  onChange={(e) => setStaffForm({ ...staffForm, branch: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  placeholder="e.g. Chennai Main Head Office"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition shadow-md"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STAFF MEMBER DETAILS */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <span>Edit Staff Member: {editingStaff.name}</span>
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Staff Full Name</label>
                <input 
                  type="text" 
                  value={editingStaff.name} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={editingStaff.email} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Assigned System Role</label>
                <select 
                  value={editingStaff.role} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full Unrestricted)</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="MANAGER">Branch Manager</option>
                  <option value="EMPLOYEE">Staff Advisor</option>
                  <option value="GREETINGS_OFFICER">Greetings Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Login Password</label>
                <input 
                  type="text" 
                  value={editingStaff.password} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">Branch / Location Desk</label>
                <input 
                  type="text" 
                  value={editingStaff.branch || ''} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, branch: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-black shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD MODAL */}
      {resettingPasswordStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Key className="h-5 w-5 text-amber-600" />
                <span>Reset Staff Password</span>
              </h3>
              <button onClick={() => setResettingPasswordStaff(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-semibold">
              <p className="text-slate-600">Enter new password for <strong>{resettingPasswordStaff.name}</strong> ({resettingPasswordStaff.email}):</p>
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold uppercase">New Password</label>
                <input 
                  type="text" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. SKStaff#2026!"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setResettingPasswordStaff(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
