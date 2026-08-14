import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchIncomeBackend, createIncomeBackend } from '../services/apiService';
import { Plus, TrendingUp, IndianRupee, Search } from 'lucide-react';

export const Income = () => {
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIncome = async () => {
    setLoading(true);
    try {
      const data = await fetchIncomeBackend();
      setIncomeList(Array.isArray(data) ? data : []);
    } catch (err) {
      setIncomeList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Income & Brokerage Register</h1>
          <p className="text-xs text-slate-500 font-semibold">Track commissions, brokerage fees, and investment dividend income.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Income ID</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {incomeList.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-slate-800">{inc.id}</td>
                  <td className="p-4 font-extrabold text-slate-900">{inc.customerName || 'Direct Client'}</td>
                  <td className="p-4"><span className="badge badge-purple">{inc.incomeType}</span></td>
                  <td className="p-4 font-mono font-extrabold text-emerald-700">₹{Number(inc.amount).toLocaleString()}</td>
                  <td className="p-4">
                    <p className="text-slate-800 font-bold">{inc.receivedDate}</p>
                    <span className="badge badge-green text-[10px]">{inc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
