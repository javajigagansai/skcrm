import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchExpensesBackend, createExpenseBackend } from '../services/apiService';
import { Plus, TrendingDown, IndianRupee, X } from 'lucide-react';

export const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newExp, setNewExp] = useState({
    category: 'Salary',
    description: '',
    amount: 15000,
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await fetchExpensesBackend();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await createExpenseBackend(newExp);
      setShowAddModal(false);
      loadExpenses();
      alert('Expense record saved successfully!');
    } catch (err) {
      alert('Error creating expense: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expense Management Tracker</h1>
          <p className="text-xs text-slate-500 font-semibold">Monitor branch operations expenses, staff salaries, marketing, and utilities.</p>
        </div>
        {user?.role !== 'VIEWER' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Expense</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Expense Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4"><span className="badge badge-amber">{exp.category}</span></td>
                  <td className="p-4 font-extrabold text-slate-900">{exp.description}</td>
                  <td className="p-4 font-mono font-extrabold text-rose-600">₹{Number(exp.amount).toLocaleString()}</td>
                  <td className="p-4 text-slate-700">{exp.expenseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Record Office Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Expense Category</label>
                <select value={newExp.category} onChange={(e) => setNewExp({...newExp, category: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none">
                  <option value="Salary">Salary</option>
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Internet">Internet</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Description</label>
                <input type="text" required value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Amount (₹)</label>
                <input type="number" required value={newExp.amount} onChange={(e) => setNewExp({...newExp, amount: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-700">Save Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
