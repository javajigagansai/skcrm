import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchReportsSummaryBackend } from '../services/apiService';
import { exportReportsSummaryPDF } from '../utils/exportUtils';
import { BarChart3, Download, Calendar, Filter, PieChart } from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [reportSummary, setReportSummary] = useState({
    period: 'MONTHLY',
    totalCustomers: 0,
    totalActiveLeads: 0,
    totalInvestmentsCount: 0,
    totalInvestmentVolume: 0,
    totalIncomeVolume: 0,
    totalExpenseVolume: 0,
    netProfit: 0
  });

  useEffect(() => {
    fetchReportsSummaryBackend()
      .then(res => {
        if (res && res.totalCustomers !== undefined) setReportSummary(res);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports &amp; Analytics Center</h1>
          <p className="text-xs text-slate-500 font-semibold">Real-time aggregated financial, conversion, and portfolio performance reports.</p>
        </div>
        {isAdminOrManager && (
          <button 
            onClick={() => exportReportsSummaryPDF(reportSummary)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
            title="Export Complete Summary Report as PDF"
          >
            <Download className="h-4 w-4" />
            <span>Export Summary Report (PDF)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-slate-500">Gross Investment Volume</span>
          <p className="text-2xl font-black text-slate-900">₹{(reportSummary.totalInvestmentVolume / 10000000).toFixed(2)} Cr</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-slate-500">Total Income</span>
          <p className="text-2xl font-black text-emerald-700">₹{(reportSummary.totalIncomeVolume / 100000).toFixed(2)} L</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-slate-500">Total Expenses</span>
          <p className="text-2xl font-black text-rose-600">₹{(reportSummary.totalExpenseVolume / 100000).toFixed(2)} L</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-slate-500">Net Profit</span>
          <p className="text-2xl font-black text-blue-700">₹{(reportSummary.netProfit / 100000).toFixed(2)} L</p>
        </div>
      </div>
    </div>
  );
};
