import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus, TrendingDown, IndianRupee, X, Users, Fuel, Zap, Building2, Filter, Sparkles, Trash2, Edit3, Search, CheckCircle } from 'lucide-react';

export const Expenses = () => {
  const { user } = useAuth();
  const { expenses = [], addExpense, updateExpense, deleteExpense, staffList = [] } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [categoryOption, setCategoryOption] = useState('Staff Salary (Payroll)');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  const [newExp, setNewExp] = useState({
    category: 'Staff Salary (Payroll)',
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    staffName: '',
    staffId: ''
  });

  // Active staff list for selection in payroll payouts
  const activeStaffList = useMemo(() => {
    return (staffList || []).filter(s => s.status !== 'DISABLED');
  }, [staffList]);

  // Handle staff selection in Add Modal
  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
    if (!staffId) return;
    const st = activeStaffList.find(s => String(s.uid || s.id) === String(staffId));
    if (st) {
      const salaryAmount = Number(st.fixedSalary !== undefined ? st.fixedSalary : (st.monthlyTarget ? Math.round(st.monthlyTarget * 0.5) : 0));
      setNewExp(prev => ({
        ...prev,
        category: 'Staff Salary (Payroll)',
        description: `Monthly Fixed Salary Payout — ${st.name} (${st.title || st.role || 'Staff Advisor'})`,
        amount: salaryAmount,
        staffName: st.name,
        staffId: st.uid || st.id
      }));
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    let list = Array.isArray(expenses) ? [...expenses] : [];

    // Filter by Category
    if (selectedCategoryFilter !== 'ALL') {
      if (selectedCategoryFilter === 'Staff Salary (Payroll)') {
        list = list.filter(e => {
          const cat = (e.category || e.title || '').toLowerCase();
          return cat.includes('salary') || cat.includes('payroll');
        });
      } else {
        list = list.filter(e => (e.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase());
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        (e.description || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.staffName || '').toLowerCase().includes(q) ||
        String(e.amount || '').includes(q) ||
        (e.expenseDate || '').includes(q)
      );
    }

    // Sort by Date Descending
    return list.sort((a, b) => {
      const dateA = new Date(a.expenseDate || a.date || a.createdAt || 0);
      const dateB = new Date(b.expenseDate || b.date || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  // Totals Breakdown based strictly on live recorded expenses in database
  const totalStaffPayroll = useMemo(() => {
    return (expenses || [])
      .filter(e => {
        const cat = (e.category || e.title || '').toLowerCase();
        return cat.includes('salary') || cat.includes('payroll');
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const totalOperationalExpenses = useMemo(() => {
    return (expenses || [])
      .filter(e => {
        const cat = (e.category || e.title || '').toLowerCase();
        return !cat.includes('salary') && !cat.includes('payroll');
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const grandTotalExpenses = totalStaffPayroll + totalOperationalExpenses;

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const finalCategory = categoryOption === 'Other' 
        ? (customCategory.trim() || 'Other') 
        : categoryOption;

      const finalExpData = {
        ...newExp,
        category: finalCategory,
        amount: Number(newExp.amount || 0),
        expenseDate: newExp.expenseDate || new Date().toISOString().split('T')[0]
      };

      await addExpense(finalExpData);
      setShowAddModal(false);
      setCategoryOption('Staff Salary (Payroll)');
      setCustomCategory('');
      setSelectedStaffId('');
      setNewExp({
        category: 'Staff Salary (Payroll)',
        description: '',
        amount: 0,
        expenseDate: new Date().toISOString().split('T')[0],
        staffName: '',
        staffId: ''
      });
      alert('Company expenditure record saved successfully!');
    } catch (err) {
      alert('Error creating expense: ' + err.message);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.id) return;
    try {
      const updatedData = {
        ...editingExpense,
        amount: Number(editingExpense.amount || 0),
        expenseDate: editingExpense.expenseDate || editingExpense.date || new Date().toISOString().split('T')[0]
      };
      if (typeof updateExpense === 'function') {
        await updateExpense(editingExpense.id, updatedData);
      } else {
        await addExpense(updatedData);
      }
      setEditingExpense(null);
      alert('Expense record updated successfully!');
    } catch (err) {
      alert('Error updating expense: ' + err.message);
    }
  };

  const handleDeleteExpense = async (exp) => {
    if (!exp || !exp.id) return;
    if (window.confirm(`Are you sure you want to permanently delete expenditure record:\n"${exp.description}" (₹${Number(exp.amount).toLocaleString('en-IN')})?`)) {
      try {
        if (typeof deleteExpense === 'function') {
          await deleteExpense(exp.id);
        }
        alert('Expense deleted successfully.');
      } catch (err) {
        alert('Error deleting expense: ' + err.message);
      }
    }
  };

  const openAddModalForCategory = (cat) => {
    setCategoryOption(cat);
    setSelectedStaffId('');
    setCustomCategory('');
    setNewExp({
      category: cat,
      description: '',
      amount: cat === 'Staff Salary (Payroll)' ? 0 : 5000,
      expenseDate: new Date().toISOString().split('T')[0],
      staffName: '',
      staffId: ''
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Company Expenditure Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Live Company Expenses, Overheads &amp; Staff Payroll Management</p>
        </div>
        {user?.role !== 'VIEWER' && (
          <div className="flex items-center space-x-2.5 flex-wrap gap-2">
            <button 
              onClick={() => openAddModalForCategory('Staff Salary (Payroll)')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span>Record Staff Salary</span>
            </button>
            <button 
              onClick={() => openAddModalForCategory('Generator & Fuel / Gas')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record Operational Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Grand Total Company Spend</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{Number(grandTotalExpenses).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total Live Recorded Expense Outflow</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-200/80 shadow-xs space-y-2 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">Staff Salary Payroll</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-900">₹{Number(totalStaffPayroll).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-purple-600 font-medium">Live Staff Salary Payout Outflow</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-2 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Operational &amp; Fuel Spending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Fuel className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-950">₹{Number(totalOperationalExpenses).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-amber-700 font-medium">Operational Overheads &amp; Office Spending</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('Staff Salary (Payroll)')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'Staff Salary (Payroll)' ? 'bg-purple-700 text-white shadow-xs' : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            Staff Payroll ({expenses.filter(e => (e.category || '').toLowerCase().includes('salary') || (e.category || '').toLowerCase().includes('payroll')).length})
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('Generator & Fuel / Gas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'Generator & Fuel / Gas' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            ⚡ Generator &amp; Fuel
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('Rent & Office Space')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'Rent & Office Space' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            🏢 Rent &amp; Office
          </button>
          <button
            onClick={() => setSelectedCategoryFilter('Electricity & Utilities')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'Electricity & Utilities' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white text-cyan-800 border border-cyan-200 hover:bg-cyan-50'
            }`}
          >
            💡 Electricity &amp; Utilities
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description, staff, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 outline-none font-semibold"
          />
        </div>
      </div>

      {/* Live Expense Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Category</th>
                <th className="p-4">Expense Description / Staff</th>
                <th className="p-4">Amount (₹)</th>
                <th className="p-4">Expense Date</th>
                <th className="p-4 text-center">Type / Source</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => {
                  const isSalary = (exp.category || '').toLowerCase().includes('salary') || (exp.category || '').toLowerCase().includes('payroll');
                  return (
                    <tr key={exp.id} className={`hover:bg-slate-50/80 transition ${isSalary ? 'bg-purple-50/15' : ''}`}>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                          isSalary ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          exp.category === 'Generator & Fuel / Gas' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          exp.category === 'Rent & Office Space' || exp.category === 'Rent' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          exp.category === 'Electricity & Utilities' || exp.category === 'Electricity' ? 'bg-cyan-100 text-cyan-900 border-cyan-300' :
                          exp.category === 'Marketing & Campaigns' || exp.category === 'Marketing' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span>{exp.description || 'Expense Entry'}</span>
                          {exp.staffName && (
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md border border-purple-200">
                              {exp.staffName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-extrabold text-rose-600 text-sm">₹{Number(exp.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-slate-700 font-mono">{exp.expenseDate || exp.date || '—'}</td>
                      <td className="p-4 text-center">
                        {isSalary ? (
                          <span className="badge bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold">
                            Live Staff Payroll 💼
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                            Operational Direct ⚡
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {user?.role !== 'VIEWER' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setEditingExpense(exp)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200 cursor-pointer"
                              title="Edit Expense Record"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition border border-rose-200 cursor-pointer"
                              title="Delete Expense Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                    No expenditure records found matching criteria. Click <strong className="text-blue-600 font-bold">"Record Staff Salary"</strong> or <strong className="text-blue-600 font-bold">"Record Operational Expense"</strong> to add entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Live Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                {categoryOption === 'Staff Salary (Payroll)' ? 'Record Staff Salary Payout' : 'Record Operational Expenditure'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Category</label>
                <select 
                  value={categoryOption} 
                  onChange={(e) => {
                    const sel = e.target.value;
                    setCategoryOption(sel);
                    if (sel !== 'Other') {
                      setNewExp(prev => ({ ...prev, category: sel }));
                    } else {
                      setNewExp(prev => ({ ...prev, category: customCategory.trim() || 'Other' }));
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500"
                >
                  <option value="Staff Salary (Payroll)">💼 Staff Salary (Payroll) Payout</option>
                  <option value="Generator & Fuel / Gas">⚡ Generator &amp; Fuel / Gas Spending</option>
                  <option value="Rent & Office Space">🏢 Rent &amp; Office Space</option>
                  <option value="Electricity & Utilities">💡 Electricity &amp; Utilities</option>
                  <option value="Internet & Telecom">🌐 Internet &amp; Telecom</option>
                  <option value="Marketing & Campaigns">📢 Marketing &amp; Campaigns</option>
                  <option value="Office Supplies & Maintenance">🛠️ Office Supplies &amp; Maintenance</option>
                  <option value="Travel & Conveyance">🚗 Travel &amp; Conveyance</option>
                  <option value="Miscellaneous">📦 Miscellaneous Operational</option>
                  <option value="Other">✏️ Other (Specify Custom)</option>
                </select>
              </div>

              {/* Staff Member Picker if Staff Salary */}
              {categoryOption === 'Staff Salary (Payroll)' && (
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-purple-800">Select Staff Member (Auto-fill default salary)</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => handleSelectStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs outline-none font-bold bg-white focus:border-purple-500"
                  >
                    <option value="">-- Choose Staff Member or Type Below --</option>
                    {activeStaffList.map(st => (
                      <option key={st.uid || st.id} value={st.uid || st.id}>
                        {st.name} — {st.title || st.role || 'Staff'} (Fixed: ₹{Number(st.fixedSalary || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {categoryOption === 'Other' && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-blue-600 mb-1">Specify Custom Category</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Generator Maintenance, Client Entertainment..." 
                    value={customCategory} 
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setNewExp(prev => ({ ...prev, category: e.target.value.trim() || 'Other' }));
                    }} 
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs outline-none bg-blue-50/30 focus:border-blue-500 font-bold" 
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Description *</label>
                <input 
                  type="text" 
                  required 
                  placeholder={categoryOption === 'Staff Salary (Payroll)' ? "Monthly Salary Payout — John Doe" : "Office Electricity Bill for Aug 2026"}
                  value={newExp.description} 
                  onChange={(e) => setNewExp({...newExp, description: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="Enter payout / expense amount"
                  value={newExp.amount} 
                  onChange={(e) => setNewExp({...newExp, amount: Number(e.target.value)})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-mono font-bold focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Date *</label>
                <input 
                  type="date" 
                  required 
                  value={newExp.expenseDate} 
                  onChange={(e) => setNewExp({...newExp, expenseDate: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500" 
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Save Company Expenditure
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Live Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Update Expenditure Record</h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Category</label>
                <input 
                  type="text"
                  required
                  value={editingExpense.category || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Description *</label>
                <input 
                  type="text" 
                  required 
                  value={editingExpense.description || ''} 
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={editingExpense.amount || 0} 
                  onChange={(e) => setEditingExpense({...editingExpense, amount: Number(e.target.value)})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-mono font-bold focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Date *</label>
                <input 
                  type="date" 
                  required 
                  value={editingExpense.expenseDate || editingExpense.date || ''} 
                  onChange={(e) => setEditingExpense({...editingExpense, expenseDate: e.target.value, date: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500" 
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer">
                Save Changes to Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
