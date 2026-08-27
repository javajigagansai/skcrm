import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus, TrendingDown, IndianRupee, X, Users, Fuel, Zap, Building2, Filter, Sparkles, Trash2 } from 'lucide-react';

export const Expenses = () => {
  const { user } = useAuth();
  const { expenses = [], addExpense, deleteExpense, staffList = [] } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [categoryOption, setCategoryOption] = useState('Generator & Fuel / Gas');
  const [customCategory, setCustomCategory] = useState('');
  const [newExp, setNewExp] = useState({
    category: 'Generator & Fuel / Gas',
    description: '',
    amount: 5000,
    expenseDate: new Date().toISOString().split('T')[0]
  });

  // Staff Salary Details automatically integrated directly from Staff Management
  const staffPayrollExpenses = useMemo(() => {
    const staffMembers = Array.isArray(staffList) ? staffList : [];
    const currentDate = new Date().toISOString().split('T')[0];

    return staffMembers
      .filter(st => st.status === 'ACTIVE' || !st.status)
      .map(st => ({
        id: `SALARY-AUTO-${st.uid || st.id || st.name}`,
        category: 'Staff Salary (Payroll)',
        description: `Monthly Fixed Salary Payout — ${st.name} (${st.title || st.role || 'Staff Advisor'})`,
        amount: Number(st.fixedSalary !== undefined ? st.fixedSalary : (st.monthlyTarget ? Math.round(st.monthlyTarget * 0.5) : 0)),
        expenseDate: currentDate,
        isAutoSalary: true,
        staffName: st.name
      }));
  }, [staffList]);

  // Combined Expenses List (Manual Operational Expenses + Auto Staff Payroll)
  const combinedExpenses = useMemo(() => {
    return [...expenses, ...staffPayrollExpenses];
  }, [expenses, staffPayrollExpenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return combinedExpenses;
    return combinedExpenses.filter(e => e.category === selectedCategoryFilter);
  }, [combinedExpenses, selectedCategoryFilter]);

  // Totals Breakdown
  const totalStaffPayroll = useMemo(() => {
    return staffPayrollExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [staffPayrollExpenses]);

  const totalOperationalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const grandTotalExpenses = totalStaffPayroll + totalOperationalExpenses;

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const finalExpData = {
        ...newExp,
        category: categoryOption === 'Other' ? (customCategory.trim() || 'Other') : categoryOption
      };
      await addExpense(finalExpData);
      setShowAddModal(false);
      setCategoryOption('Generator & Fuel / Gas');
      setCustomCategory('');
      setNewExp({
        category: 'Generator & Fuel / Gas',
        description: '',
        amount: 5000,
        expenseDate: new Date().toISOString().split('T')[0]
      });
      alert('Expense record saved successfully!');
    } catch (err) {
      alert('Error creating expense: ' + err.message);
    }
  };

  const handleDeleteExpense = async (exp) => {
    if (!exp || !exp.id) return;
    if (window.confirm(`Are you sure you want to permanently delete expense:\n"${exp.description}" (₹${Number(exp.amount).toLocaleString()})?`)) {
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Company Expenditure Tracker</span>
          </h1>
        </div>
        {user?.role !== 'VIEWER' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Record Operational Expense</span>
          </button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Grand Total Monthly Spend</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{grandTotalExpenses.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total Monthly Expense Outflow</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-200/80 shadow-xs space-y-2 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">Staff Salary Payroll</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-900">₹{totalStaffPayroll.toLocaleString()}</p>
          <p className="text-[11px] text-purple-600 font-medium">Monthly Active Staff Payroll Outflow</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-2 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Operational &amp; Fuel Spending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Fuel className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-950">₹{totalOperationalExpenses.toLocaleString()}</p>
          <p className="text-[11px] text-amber-700 font-medium">Operational Overheads &amp; Office Spending</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategoryFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Expenses ({combinedExpenses.length})
        </button>
        <button
          onClick={() => setSelectedCategoryFilter('Staff Salary (Payroll)')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'Staff Salary (Payroll)' ? 'bg-purple-700 text-white shadow-xs' : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
          }`}
        >
          Staff Payroll
        </button>
        <button
          onClick={() => setSelectedCategoryFilter('Generator & Fuel / Gas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'Generator & Fuel / Gas' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          ⚡ Generator &amp; Fuel / Gas
        </button>
        <button
          onClick={() => setSelectedCategoryFilter('Rent & Office Space')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'Rent & Office Space' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          🏢 Rent &amp; Office Space
        </button>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Category</th>
                <th className="p-4">Expense Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Expense Date</th>
                <th className="p-4 text-center">Type / Source</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className={`hover:bg-slate-50/80 transition ${exp.isAutoSalary ? 'bg-purple-50/20' : ''}`}>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                      exp.category === 'Staff Salary (Payroll)' ? 'bg-purple-100 text-purple-900 border-purple-300' :
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
                      <span>{exp.description}</span>
                      {exp.isAutoSalary && (
                        <span className="text-[10px] font-extrabold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">Staff Management</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-extrabold text-rose-600 text-sm">₹{Number(exp.amount).toLocaleString()}</td>
                  <td className="p-4 text-slate-700">{exp.expenseDate}</td>
                  <td className="p-4 text-center">
                    {exp.isAutoSalary ? (
                      <span className="badge bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold">
                        Auto Salary Payout
                      </span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                        Operational Direct
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {!exp.isAutoSalary && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || !user?.role) ? (
                      <button
                        onClick={() => handleDeleteExpense(exp)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition border border-rose-200 cursor-pointer"
                        title="Delete Expense Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Operational Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
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
                      setNewExp({ ...newExp, category: sel });
                    } else {
                      setNewExp({ ...newExp, category: customCategory.trim() || 'Other' });
                    }
                  }} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-500"
                >
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

                {categoryOption === 'Other' && (
                  <div className="mt-2.5">
                    <label className="block text-[11px] font-black uppercase text-blue-600 mb-1">Specify Custom Category</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Generator Maintenance, Client Entertainment..." 
                      value={customCategory} 
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setNewExp({ ...newExp, category: e.target.value.trim() || 'Other' });
                      }} 
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs outline-none bg-blue-50/30 focus:border-blue-500 font-bold" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Description *</label>
                <input 
                  type="text" 
                  required 
                  placeholder=""
                  value={newExp.description} 
                  onChange={(e) => setNewExp({...newExp, description: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  placeholder=""
                  value={newExp.amount} 
                  onChange={(e) => setNewExp({...newExp, amount: Number(e.target.value)})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-mono font-bold" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Date</label>
                <input 
                  type="date" 
                  required 
                  value={newExp.expenseDate} 
                  onChange={(e) => setNewExp({...newExp, expenseDate: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold" 
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-700 cursor-pointer">
                Save Operational Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
