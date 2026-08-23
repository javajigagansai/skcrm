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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadSummary = (filter) => {
    fetchReportsSummaryBackend(filter)
      .then(res => {
        if (res && res.totalCustomers !== undefined) setReportSummary(res);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSummary('MONTHLY');
  }, []);

  const handleApplyCustomDate = () => {
    loadSummary('CUSTOM');
  };

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

      {/* Date Range Custom Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-xs shrink-0">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Date:</span>
          </div>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
            placeholder="dd-mm-yyyy"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[135px]"
            placeholder="dd-mm-yyyy"
          />
          <button
            type="button"
            onClick={handleApplyCustomDate}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center"
          >
            Filter
          </button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                loadSummary('MONTHLY');
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Reset
            </button>
          )}
        </div>
        <span className="text-xs text-slate-500 font-bold">
          Active Reporting Period: <strong className="text-slate-900">{startDate && endDate ? `${startDate} to ${endDate}` : 'Current Month'}</strong>
        </span>
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
