import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { fetchReportsSummaryBackend } from '../services/apiService';
import { exportDashboardAnalyticsPDF } from '../utils/exportUtils';
import { SpecialDays } from './SpecialDays';
import { 
  Users, UserCheck, IndianRupee, TrendingUp, Plus, Download, Calendar as CalendarIcon, 
  Clock, CheckCircle2, ShieldCheck, PartyPopper, Sparkles, Filter, Award, 
  FileText, X, ExternalLink, ChevronRight, Info, BarChart3, PieChart as PieIcon,
  ShieldAlert, Activity, ArrowUpRight, Building2, TrendingDown, DollarSign, Percent, Scale, Briefcase
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCustomer360 } = useCustomer360();
  const { customers, leads, policies, investments, income, expenses } = useData();

  const [dateFilter, setDateFilter] = useState('THIS_MONTH');
  const [activeModal, setActiveModal] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER' || user?.role === 'STAFF';

  const dynamicFinancialsChart = useMemo(() => {
    // Live totals in Lakhs
    const policyRev = (policies || []).reduce((s, p) => s + (Number(p.grossPremium) || 0), 0);
    const incRev = (income || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalRevLakhs = Math.max(0.5, (policyRev + incRev) / 100000);

    const totalOpExpLakhs = Math.max(0.1, ((expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)) / 100000);
    const totalSalExpLakhs = Math.max(0.2, totalRevLakhs * 0.20);

    if (dateFilter === 'TODAY') {
      const hours = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'];
      return hours.map((label, idx) => {
        const factor = (idx + 1) / hours.length;
        const revenue = Number((totalRevLakhs * 0.15 * factor).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * 0.15 * factor).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * 0.15 * factor).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, revenue, salaryExpense, operationalExpense, totalExpenses, netProfit, govtTaxAdvantage };
      });
    } else if (dateFilter === 'THIS_MONTH') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dates = [`07-${mo}-${yr}`, `14-${mo}-${yr}`, `21-${mo}-${yr}`, `28-${mo}-${yr}`];
      
      const weights = [0.22, 0.28, 0.24, 0.26];
      return dates.map((label, idx) => {
        const weight = weights[idx];
        const revenue = Number((totalRevLakhs * weight).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * weight).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * weight).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, revenue, salaryExpense, operationalExpense, totalExpenses, netProfit, govtTaxAdvantage };
      });
    } else {
      // THIS_YEAR (12 Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((label, idx) => {
        const weight = 0.06 + (idx * 0.004);
        const revenue = Number((totalRevLakhs * weight).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * weight).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * weight).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, revenue, salaryExpense, operationalExpense, totalExpenses, netProfit, govtTaxAdvantage };
      });
    }
  }, [dateFilter, policies, income, expenses]);

  const dynamicAcquisitionsChart = useMemo(() => {
    if (reportSummary?.acquisitionsChart && Array.isArray(reportSummary.acquisitionsChart) && reportSummary.acquisitionsChart.length > 0) {
      return reportSummary.acquisitionsChart;
    }

    const totalClients = Math.max(1, (customers || []).length);
    const totalPolicies = Math.max(1, (policies || []).length);

    if (dateFilter === 'TODAY') {
      const hours = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'];
      return hours.map((month, idx) => {
        const factor = (idx + 1) / hours.length;
        const newClients = Math.max(1, Math.round((totalClients / 6) * factor));
        const policiesIssued = Math.max(1, Math.round((totalPolicies / 6) * factor));
        return { month, newClients, policiesIssued };
      });
    } else if (dateFilter === 'THIS_MONTH') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dates = [`07-${mo}-${yr}`, `14-${mo}-${yr}`, `21-${mo}-${yr}`, `28-${mo}-${yr}`];
      const weights = [0.22, 0.28, 0.24, 0.26];

      return dates.map((month, idx) => {
        const weight = weights[idx];
        const newClients = Math.max(1, Math.round(totalClients * weight));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight));
        return { month, newClients, policiesIssued };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => {
        const weight = 0.05 + (idx * 0.005);
        const newClients = Math.max(1, Math.round(totalClients * weight));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight));
        return { month, newClients, policiesIssued };
      });
    }
  }, [dateFilter, customers, policies, reportSummary]);

  useEffect(() => {
    fetchReportsSummaryBackend(dateFilter)
      .then(res => { if (res) setReportSummary(res); })
      .catch(() => {});
  }, [dateFilter]);

  const greetingsReport = useMemo(() => {
    const saved = localStorage.getItem('crm_v2_daily_greetings_status');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  }, []);

  // Dynamic Staff Performance Computations
  const myAssignedCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    if (!user || (!user.name && !user.email)) return [];

    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];
    const activeEmail = (user.email || '').toLowerCase().trim();
    const activeUid = user.uid || '';

    return customers.filter(c => {
      const assignedName = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || '').toLowerCase().trim();
      const assignedEmail = (c.assignedStaffEmail || c.advisorEmail || '').toLowerCase().trim();

      if (assignedName && (assignedName === activeName || (activeFirst.length > 2 && assignedName.split(' ')[0] === activeFirst))) return true;
      if (assignedEmail && activeEmail && assignedEmail === activeEmail) return true;
      if (c.staffId && c.staffId === activeUid) return true;

      return false;
    });
  }, [customers, user]);

  const myAssignedPolicies = useMemo(() => {
    if (!policies || !Array.isArray(policies)) return [];
    if (!user || !user.name) return [];

    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];

    return policies.filter(p => {
      const assigned = (p.assignedStaff || p.assignedTo || '').toLowerCase().trim();
      return assigned && (assigned === activeName || (activeFirst.length > 2 && assigned.split(' ')[0] === activeFirst));
    });
  }, [policies, user]);

  const staffBusinessLeaderboard = useMemo(() => {
    const staffMap = {};

    // 1. Compute real-time business totals from active policies
    (policies || []).forEach(p => {
      const name = (p.assignedStaff || p.assignedTo || p.advisorName || 'Priya Sharma').trim();
      if (!staffMap[name]) staffMap[name] = { name, businessAmount: 0, policyCount: 0 };
      staffMap[name].businessAmount += Number(p.grossPremium || p.premiumAmount || 0);
      staffMap[name].policyCount += 1;
    });

    // 2. Compute real-time business totals from active investments
    (investments || []).forEach(i => {
      const name = (i.advisorName || i.assignedStaff || 'Priya Sharma').trim();
      if (!staffMap[name]) staffMap[name] = { name, businessAmount: 0, policyCount: 0 };
      staffMap[name].businessAmount += Number(i.amount || i.investmentAmount || 0);
      staffMap[name].policyCount += 1;
    });

    return Object.values(staffMap).sort((a, b) => b.businessAmount - a.businessAmount);
  }, [policies, investments]);

  const staffClientLeaderboard = useMemo(() => {
    const staffMap = {};

    (customers || []).forEach(c => {
      const name = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || 'Priya Sharma').trim();
      if (!staffMap[name]) staffMap[name] = { name, clientCount: 0 };
      staffMap[name].clientCount += 1;
    });

    return Object.values(staffMap).sort((a, b) => b.clientCount - a.clientCount);
  }, [customers]);

  const currentMetrics = {
    customers: customers.length > 0 ? customers.length.toLocaleString() : (reportSummary?.totalCustomers !== undefined ? reportSummary.totalCustomers.toLocaleString() : '0'),
    activeLeads: leads.length > 0 ? leads.filter(l => l.leadStatus !== 'CONVERTED').length.toLocaleString() : (reportSummary?.totalActiveLeads !== undefined ? reportSummary.totalActiveLeads.toLocaleString() : '0'),
    investmentVolume: investments.length > 0 ? `₹${(investments.reduce((s, i) => s + (Number(i.amount) || 0), 0) / 10000000).toFixed(2)} Cr` : (reportSummary?.totalInvestmentVolume ? `₹${(reportSummary.totalInvestmentVolume / 10000000).toFixed(2)} Cr` : '₹0.00'),
    acquisitionsChart: reportSummary?.acquisitionsChart || [],
    incomeExpenseChart: reportSummary?.incomeExpenseChart || [],
    conversionClaimsChart: reportSummary?.conversionClaimsChart || [],
    staffPerformanceChart: reportSummary?.staffPerformanceChart || [],
    productDistributionChart: reportSummary?.productDistributionChart || []
  };

  const renderAnalysisModal = () => {
    if (!activeModal) return null;

    let title = "";
    let subtitle = "";
    let content = null;

    if (activeModal === 'TOTAL_CUSTOMERS') {
      title = "Total Customers Breakdown & Segment Analysis";
      subtitle = `Comprehensive audit of ${currentMetrics.customers} registered clients across retail, HNI, and corporate sectors.`;
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Retail Clients</span>
              <p className="text-xl font-black text-slate-900">{customers.length}</p>
              <span className="text-[10px] text-slate-500">Retail Portfolio</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">HNI Clients</span>
              <p className="text-xl font-black text-slate-900">{Math.ceil(customers.length * 0.3)}</p>
              <span className="text-[10px] text-slate-500">HNI Portfolio</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Active Policies</span>
              <p className="text-xl font-black text-slate-900">{policies.length}</p>
              <span className="text-[10px] text-slate-500">Contracts</span>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Active Investments</span>
              <p className="text-xl font-black text-slate-900">{investments.length}</p>
              <span className="text-[10px] text-slate-500">Holdings</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Key Customer Samples &amp; Status</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Code / Phone</th>
                    <th className="p-3">Assigned Advisor</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No registered customer breakdown records available.</td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              openCustomer360(c.name);
                            }}
                            className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                          >
                            <span>{c.name}</span>
                            <Sparkles className="h-3 w-3 text-amber-500" />
                          </button>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{c.customerCode || c.phone}</td>
                        <td className="p-3 font-bold text-purple-700">{c.assignedAdvisorName || 'Priya Sharma'}</td>
                        <td className="p-3 text-slate-600">{c.city || 'Chennai'}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              openCustomer360(c.name);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-[10px] transition cursor-pointer"
                          >
                            View 360° Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/customers');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Manage Customer 360</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Analytics (PDF)</span>
            </button>
          </div>
        </div>
      );
    } else if (activeModal === 'ACTIVE_POLICIES') {
      title = "Active Policies & Portfolio Distribution";
      subtitle = `Detailed breakdown of active insurance policy contracts and mutual fund folios.`;
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-bold text-sky-600 uppercase">Health Floaters</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.healthPoliciesCount || 0} Policies</p>
              <span className="text-[10px] text-slate-500">Star / Care / Neva</span>
            </div>
            <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Term Life Plans</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.lifePoliciesCount || 0} Policies</p>
              <span className="text-[10px] text-slate-500">HDFC / ICICI / TATA</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Mutual Fund SIPs</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.sipFoliosCount || 0} Folios</p>
              <span className="text-[10px] text-slate-500">Active Autopay SIPs</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Motor &amp; Others</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.motorContractsCount || 0} Contracts</p>
              <span className="text-[10px] text-slate-500">Vehicle &amp; Property</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Recent Active Policy Contracts</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Insurance Company</th>
                    <th className="p-3">Sum Insured</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No active policy contracts registered yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/policies');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Insurance Policies Register</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Analytics (PDF)</span>
            </button>
          </div>
        </div>
      );
    } else if (activeModal === 'INVESTMENTS_VOLUME') {
      title = "Investments & Assets Under Management (AUM)";
      subtitle = `Detailed breakdown of ${currentMetrics.investmentVolume} total portfolio volume across asset classes.`;
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Mutual Funds &amp; SIP</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.mutualFundsVolume ? `₹${(reportSummary.mutualFundsVolume / 10000000).toFixed(2)} Cr` : '₹0.00'}</p>
              <span className="text-[10px] text-slate-500">Mutual Fund Portfolios</span>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">FDs &amp; Fixed Income</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.fixedIncomeVolume ? `₹${(reportSummary.fixedIncomeVolume / 10000000).toFixed(2)} Cr` : '₹0.00'}</p>
              <span className="text-[10px] text-slate-500">Fixed Income Assets</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Insurance Policies AUM</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.insuranceAumVolume ? `₹${(reportSummary.insuranceAumVolume / 10000000).toFixed(2)} Cr` : '₹0.00'}</p>
              <span className="text-[10px] text-slate-500">Insurance Contracts AUM</span>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Real Estate &amp; Bonds</span>
              <p className="text-xl font-black text-slate-900">{reportSummary?.otherAssetsVolume ? `₹${(reportSummary.otherAssetsVolume / 10000000).toFixed(2)} Cr` : '₹0.00'}</p>
              <span className="text-[10px] text-slate-500">Bonds &amp; Other Assets</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Recent Investment Registrations</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Investment Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Folio / Policy #</th>
                    <th className="p-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No registered investment records available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/investments');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>View Investments Register</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Analytics (PDF)</span>
            </button>
          </div>
        </div>
      );
    } else if (activeModal === 'CLIENT_ACQUISITIONS_CHART' || activeModal === 'INVESTMENT_GROWTH_CHART') {
      title = "Chart Analysis: Monthly New Client Acquisitions & Policy Issuances";
      subtitle = `Complete breakdown of customer onboarding and policy issuance velocity (${dateFilter}).`;
      content = (
        <div className="space-y-6">
          <div className="h-[440px] w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dynamicAcquisitionsChart}
                margin={{ top: 15, right: 20, left: -10, bottom: dateFilter === 'THIS_MONTH' ? 20 : 0 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={dateFilter === 'THIS_MONTH' ? -45 : 0}
                  textAnchor={dateFilter === 'THIS_MONTH' ? 'end' : 'middle'}
                  height={dateFilter === 'THIS_MONTH' ? 55 : 30}
                  tick={{ fontSize: dateFilter === 'THIS_MONTH' ? 10 : 11, fontWeight: 700 }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="newClients" fill="#1E6091" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="New Clients Onboarded" />
                <Bar dataKey="policiesIssued" fill="#52B69A" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Policies & SIPs Issued" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Acquisition Data Table ({dateFilter})</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timeline Period</th>
                    <th className="p-3">New Clients Onboarded</th>
                    <th className="p-3">Policies &amp; SIPs Issued</th>
                    <th className="p-3">Issuances per Client</th>
                    <th className="p-3">Growth Velocity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dynamicAcquisitionsChart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No client acquisition records available.</td>
                    </tr>
                  ) : (
                    dynamicAcquisitionsChart.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-900">{row.month}</td>
                        <td className="p-3 font-bold text-blue-700">{row.newClients} Clients</td>
                        <td className="p-3 font-bold text-emerald-700">{row.policiesIssued} Policies</td>
                        <td className="p-3 font-bold text-purple-700">{(row.policiesIssued / (row.newClients || 1)).toFixed(2)}</td>
                        <td className="p-3"><span className="badge badge-green text-[10px]">Active Track</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeModal === 'INCOME_EXPENSE_CHART') {
      title = "Chart Analysis: Income vs Operational Expense Variance";
      subtitle = `Revenue received vs operational overhead expenses comparison (${dateFilter}).`;
      content = (
        <div className="space-y-6">
          <div className="h-[440px] w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={currentMetrics.incomeExpenseChart}
                margin={{ top: 15, right: 20, left: -10, bottom: dateFilter === 'THIS_MONTH' ? 20 : 0 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={dateFilter === 'THIS_MONTH' ? -45 : 0}
                  textAnchor={dateFilter === 'THIS_MONTH' ? 'end' : 'middle'}
                  height={dateFilter === 'THIS_MONTH' ? 55 : 30}
                  tick={{ fontSize: dateFilter === 'THIS_MONTH' ? 10 : 11, fontWeight: 700 }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Income (Lakhs)" />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Expense (Lakhs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Variance &amp; Profit Table ({dateFilter})</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Income (Lakhs)</th>
                    <th className="p-3">Expense (Lakhs)</th>
                    <th className="p-3">Net Profit</th>
                    <th className="p-3">Profit Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentMetrics.incomeExpenseChart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No income vs expense data available.</td>
                    </tr>
                  ) : (
                    currentMetrics.incomeExpenseChart.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-900">{row.month}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{row.income} L</td>
                        <td className="p-3 font-bold text-rose-600">₹{row.expense} L</td>
                        <td className="p-3 font-bold text-blue-700">₹{(row.income - row.expense).toFixed(2)} L</td>
                        <td className="p-3"><span className="badge badge-green text-[10px]">{(((row.income - row.expense)/(row.income || 1))*100).toFixed(1)}%</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeModal === 'CONVERSION_CLAIMS_CHART') {
      title = "Chart Analysis: Lead Conversion & Claims Settlement Rates";
      subtitle = `Product category performance analysis across lead conversion rates and claims resolution (${dateFilter}).`;
      content = (
        <div className="space-y-6">
          <div className="h-56 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMetrics.conversionClaimsChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend />
                <Bar dataKey="leadConversion" fill="#6366F1" radius={[6, 6, 0, 0]} name="Lead Conversion %" />
                <Bar dataKey="claimSettlement" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Claim Settlement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Category Comparison Table</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product Category</th>
                    <th className="p-3">Lead Conversion Rate</th>
                    <th className="p-3">Claims Settlement Ratio</th>
                    <th className="p-3">Avg SLA Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentMetrics.conversionClaimsChart.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400 font-semibold">No lead conversion or claims settlement data available.</td>
                    </tr>
                  ) : (
                    currentMetrics.conversionClaimsChart.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-900">{row.category}</td>
                        <td className="p-3 font-bold text-indigo-700">{row.leadConversion}%</td>
                        <td className="p-3 font-bold text-teal-700">{row.claimSettlement}%</td>
                        <td className="p-3 text-slate-600 font-bold">{idx === 0 ? '2 Days' : idx === 1 ? '3 Days' : '1 Day'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeModal === 'STAFF_PERFORMANCE_CHART') {
      title = "Chart Analysis: Staff Advisor Revenue Leaderboard";
      subtitle = `Revenue contribution per advisor (${dateFilter}).`;
      content = (
        <div className="space-y-6">
          <div className="h-56 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMetrics.staffPerformanceChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend />
                <Bar dataKey="target" fill="#94A3B8" radius={[6, 6, 0, 0]} name="Target" />
                <Bar dataKey="achieved" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Achieved" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Advisor Ranking &amp; Incentives</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Advisor Name</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Achieved</th>
                    <th className="p-3">Completion %</th>
                    <th className="p-3">Incentive Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentMetrics.staffPerformanceChart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No staff advisor performance records available.</td>
                    </tr>
                  ) : (
                    currentMetrics.staffPerformanceChart.map((row, idx) => {
                      const pct = ((row.achieved / (row.target || 1)) * 100).toFixed(1);
                      return (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-slate-900">{row.name}</td>
                          <td className="p-3 text-slate-600 font-bold">{row.target}</td>
                          <td className="p-3 font-bold text-amber-700">{row.achieved}</td>
                          <td className="p-3 font-bold text-indigo-700">{pct}%</td>
                          <td className="p-3">
                            {pct >= 100 ? (
                              <span className="badge badge-green text-[10px]">Bonus Eligible 🏆</span>
                            ) : (
                              <span className="badge badge-amber text-[10px]">On Track</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (activeModal === 'PRODUCT_DISTRIBUTION_CHART') {
      title = "Chart Analysis: Portfolio Product Share Breakdown";
      subtitle = `Product volume distribution (${dateFilter}).`;
      content = (
        <div className="space-y-6">
          <div className="h-56 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentMetrics.productDistributionChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {currentMetrics.productDistributionChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Product Mix Breakdown</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Share %</th>
                    <th className="p-3">Est. Volume Contribution</th>
                    <th className="p-3">Risk Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentMetrics.productDistributionChart.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }}></span>
                        <span>{row.name}</span>
                      </td>
                      <td className="p-3 font-bold text-blue-700">{row.value}%</td>
                      <td className="p-3 font-bold text-emerald-700">₹{(((row.value * (reportSummary?.totalInvestmentVolume || 0)) / 100) / 10000000).toFixed(2)} Cr</td>
                      <td className="p-3"><span className="badge badge-brand text-[10px]">{idx === 2 ? 'Moderate Risk' : idx === 4 ? 'High Growth' : 'Low Risk / Guaranteed'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
          <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-black tracking-tight">{title}</h3>
              </div>
              <p className="text-xs text-slate-400 font-semibold">{subtitle}</p>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {content}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end">
            <button 
              onClick={() => setActiveModal(null)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Analysis Window
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modal Overlay */}
      {renderAnalysisModal()}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1E6091] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Admin'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold">
              Insurance &amp; Investment Advisory Operations Desk
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/customers')} className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white text-[#1E6091] font-bold text-xs shadow hover:bg-blue-50 transition cursor-pointer">
              <UserCheck className="h-4 w-4" />
              <span>Customer Directory</span>
            </button>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart)} 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
                title="Export Dashboard Analytics as PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Analytics Timeline Filter:</span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setDateFilter('TODAY')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'TODAY' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setDateFilter('THIS_MONTH')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            This Month
          </button>
          <button 
            onClick={() => setDateFilter('THIS_YEAR')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'THIS_YEAR' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            This Year
          </button>
        </div>
      </div>





      {/* KPI Overview Cards - Interactive Clickable Grid (5 Key Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => {
            if (isStaffAdvisor) {
              navigate('/customers');
            } else {
              setActiveModal('TOTAL_CUSTOMERS');
            }
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-blue-500 hover:shadow-lg transition cursor-pointer group relative"
          title={isStaffAdvisor ? 'Click to view your assigned client portfolios' : 'Click to view detailed customer breakdown & analysis'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-blue-600 transition">
              {isStaffAdvisor ? 'My Assigned Clients' : 'Total Customers'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition"><Users className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {isStaffAdvisor ? myAssignedCustomers.length : currentMetrics.customers}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="badge badge-green text-[10px]">
              {isStaffAdvisor ? 'Assigned Portfolios' : 'Active Registered'}
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center space-x-0.5">
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveModal('ACTIVE_POLICIES')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-purple-500 hover:shadow-lg transition cursor-pointer group relative"
          title="Click to view active policies & portfolio distribution"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-purple-600 transition">Active Policies</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition"><FileText className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">{reportSummary?.totalInvestmentsCount !== undefined ? reportSummary.totalInvestmentsCount.toLocaleString() : '0'}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="badge badge-purple text-[10px]">{reportSummary?.totalInvestmentsCount || 0} Active Folios</span>
            <span className="text-[10px] font-extrabold text-purple-600 hover:underline flex items-center space-x-0.5">
              <span>View Details</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveModal('INVESTMENTS_VOLUME')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-emerald-500 hover:shadow-lg transition cursor-pointer group relative"
          title="Click to view investments volume analysis"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-emerald-600 transition">Investments Volume</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition"><IndianRupee className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">{currentMetrics.investmentVolume}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="badge badge-green text-[10px]">Active Portfolios</span>
          </div>
        </div>

        {/* NEW CARD 1 & 2: Company & Employee Expenditure (Admin Only) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <>
            <div 
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-amber-500 hover:shadow-lg transition cursor-pointer group relative"
              title="Company Operating Overhead Expenses"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-amber-600 transition">Company Expenditure</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition"><Building2 className="h-4 w-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹8.30 L</p>
              <div className="flex items-center justify-between pt-1">
                <span className="badge bg-amber-100 text-amber-800 text-[10px]">Rent, Software &amp; Infra</span>
              </div>
            </div>

            <div 
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-rose-500 hover:shadow-lg transition cursor-pointer group relative"
              title="Staff Payroll & Salary Expenditure"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-rose-600 transition">Employee Salary Spend</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition"><TrendingDown className="h-4 w-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹16.40 L</p>
              <div className="flex items-center justify-between pt-1">
                <span className="badge bg-rose-100 text-rose-800 text-[10px]">Staff Advisor Payroll</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DASHBOARD LIVE CUSTOMER DIRECTORY (HIDDEN FROM STAFF) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Registered Customers &amp; Account Profiles</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Click any customer below to view their unified 360° profile with linked policies, claims &amp; holdings.</p>
            </div>
            <button 
              onClick={() => navigate('/customers')}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {customers.map(c => (
              <div key={c.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-md transition space-y-2 group">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => openCustomer360(c.name)}
                    className="font-black text-slate-900 group-hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1.5"
                  >
                    <span>{c.name}</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </button>
                  <span className="badge bg-blue-100 text-blue-800 text-[10px] font-black">{c.customerCode || c.id}</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>📞 Phone: <strong>{c.phone || c.mobileNumber || '9876543210'}</strong></p>
                  <p>📍 City: <strong>{c.city || 'Chennai'}</strong></p>
                  <p>👤 Advisor: <strong className="text-purple-700">{c.assignedAdvisorName || 'Priya Sharma'}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="badge badge-green text-[9px] font-bold">Active KYC</span>
                  <button
                    onClick={() => openCustomer360(c.name)}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] transition cursor-pointer shadow-xs"
                  >
                    Open 360° Profile
                  </button>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="col-span-full p-6 text-center text-xs text-slate-400 font-semibold">
                No customers registered yet. Click "Customer Directory" to create your first customer.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD STAFF PERFORMANCE LEADERBOARDS (HIDDEN FROM STAFF) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEADERBOARD A: STAFF GENERATING MOST BUSINESS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span>1. Staff Doing Most Business (Revenue Leaderboard)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Highest revenue generating advisors &amp; policy issuers.</p>
              </div>
              <span className="badge badge-amber text-[10px] uppercase font-black">Business Rank 🏆</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Staff Advisor</th>
                    <th className="p-3">Policies / SIPs</th>
                    <th className="p-3">Total Business Value</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffBusinessLeaderboard.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-black">
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{st.name}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{st.policyCount} Contracts</td>
                      <td className="p-3 font-black text-emerald-700">₹{st.businessAmount.toLocaleString()}</td>
                      <td className="p-3">
                        {idx === 0 ? (
                          <span className="badge badge-green text-[10px]">Top Business Leader 🏆</span>
                        ) : (
                          <span className="badge badge-brand text-[10px]">Active Business</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LEADERBOARD B: STAFF HANDLING MOST CLIENTS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span>2. Staff Handling Most Clients (Workload Leaderboard)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Advisors with maximum assigned client portfolios.</p>
              </div>
              <span className="badge badge-purple text-[10px] uppercase font-black">Client Workload 📊</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Staff Advisor</th>
                    <th className="p-3">Assigned Clients</th>
                    <th className="p-3">Portfolio Share</th>
                    <th className="p-3">Capacity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffClientLeaderboard.map((st, idx) => {
                    const totalCusts = customers.length || 1;
                    const pct = ((st.clientCount / totalCusts) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-black">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                          <span>{st.name}</span>
                        </td>
                        <td className="p-3 font-bold text-indigo-700">{st.clientCount} Clients</td>
                        <td className="p-3 font-black text-slate-800">{pct}% Share</td>
                        <td className="p-3">
                          {idx === 0 ? (
                            <span className="badge badge-purple text-[10px]">Max Workload ⚡</span>
                          ) : (
                            <span className="badge badge-green text-[10px]">Optimal Load</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BAR GRAPH 1 & 2 GRID - Full Width for Maximum Day-to-Day Spacing */}
      <div className="grid grid-cols-1 gap-8">
        {/* GRAPH 1: Monthly New Client Acquisitions & Policy Issuances */}
        <div 
          onClick={() => setActiveModal('CLIENT_ACQUISITIONS_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
          title="Click to view full client acquisition & policy issuance details"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5">
                <span>1. Monthly New Client Acquisitions &amp; Policy Issuances</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-[11px] text-slate-500">Tracking new customer onboarding vs insurance &amp; SIP policies issued ({dateFilter})</p>
            </div>
            <span className="badge badge-brand text-[10px]">Acquisitions • Click Details 🔍</span>
          </div>

          <div className="h-[480px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dynamicAcquisitionsChart}
                margin={{ top: 15, right: 20, left: -10, bottom: dateFilter === 'THIS_MONTH' ? 20 : 0 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={dateFilter === 'THIS_MONTH' ? -45 : 0}
                  textAnchor={dateFilter === 'THIS_MONTH' ? 'end' : 'middle'}
                  height={dateFilter === 'THIS_MONTH' ? 55 : 30}
                  tick={{ fontSize: dateFilter === 'THIS_MONTH' ? 10 : 11, fontWeight: 700 }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="newClients" fill="#1E6091" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="New Clients Onboarded" />
                <Bar dataKey="policiesIssued" fill="#52B69A" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Policies & SIPs Issued" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Understanding Terms Box */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5 font-black text-slate-800">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Understanding Terms &amp; Key Metrics:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <p>• <strong>New Clients Onboarded:</strong> First-time registered clients with active portfolios.</p>
              <p>• <strong>Policies &amp; SIPs Issued:</strong> Total insurance policies &amp; mutual fund folios activated.</p>
            </div>
          </div>
        </div>

        {/* GRAPH 2: Income vs Expense Variance */}
        <div 
          onClick={() => setActiveModal('INCOME_EXPENSE_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
          title="Click to view complete income vs expense variance breakdown"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition flex items-center space-x-1.5">
                <span>2. Income vs Expense Variance (Lakhs)</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-[11px] text-slate-500">Revenue Received vs Operational Expenses ({dateFilter})</p>
            </div>
            <span className="badge badge-green text-[10px]">Net Margin +64% • Click Details 🔍</span>
          </div>

          <div className="h-[480px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={currentMetrics.incomeExpenseChart}
                margin={{ top: 15, right: 20, left: -10, bottom: dateFilter === 'THIS_MONTH' ? 20 : 0 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={dateFilter === 'THIS_MONTH' ? -45 : 0}
                  textAnchor={dateFilter === 'THIS_MONTH' ? 'end' : 'middle'}
                  height={dateFilter === 'THIS_MONTH' ? 55 : 30}
                  tick={{ fontSize: dateFilter === 'THIS_MONTH' ? 10 : 11, fontWeight: 700 }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Income (Lakhs)" />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Expense (Lakhs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* EXECUTIVE FINANCIAL & PROFITABILITY RADAR: 12 MONTHS COMPANY EXPENSES, EMPLOYEE SALARIES & GOVT TAX ADVANTAGE (ADMIN ONLY) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span>12-Month Company Expenses, Employee Salaries &amp; Govt Tax Advantage Radar</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold">One Dozen (12 Months) Financial Outflow, Staff Payroll Spends, Operating Overhead, Net Profitability &amp; Government Tax Comparison Graph.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-green text-xs font-black">Net Margin: +68.8% 🚀</span>
              <span className="badge badge-brand text-xs font-black">GST ITC Credit: 18% 🏛️</span>
            </div>
          </div>

          {/* 5 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Gross Revenue (12M)</span>
              <p className="text-xl font-black text-slate-900 mt-1">₹79.20 L</p>
              <span className="text-[10px] font-extrabold text-blue-600">Commission Receipts</span>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Staff Salary Spends</span>
              <p className="text-xl font-black text-rose-900 mt-1">₹16.40 L</p>
              <span className="text-[10px] font-extrabold text-rose-600">Advisor Payroll Outflow</span>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Operating Expenses</span>
              <p className="text-xl font-black text-amber-900 mt-1">₹8.30 L</p>
              <span className="text-[10px] font-extrabold text-amber-700">Rent, Infra &amp; Software</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Net Operating Profit</span>
              <p className="text-xl font-black text-emerald-900 mt-1">₹54.50 L</p>
              <span className="text-[10px] font-extrabold text-emerald-600">+68.8% Profit Margin</span>
            </div>

            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">Govt Tax Advantage</span>
              <p className="text-xl font-black text-purple-900 mt-1">₹8.09 L</p>
              <span className="text-[10px] font-extrabold text-purple-600">GST ITC + Tax Incentive</span>
            </div>
          </div>

          {/* Recharts Financial Outflow vs Net Profit Bar/Line Chart */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Financial Comparison Chart ({dateFilter === 'TODAY' ? 'Today (Hourly 24h)' : dateFilter === 'THIS_MONTH' ? 'This Month (By Date)' : 'This Year (12 Months)'}) — Revenue vs Expenses vs Net Profit vs Govt Tax Advantage
            </h4>
            <div className="h-[420px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicFinancialsChart} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 800 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 800 }} unit="L" />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="revenue" fill="#1E6091" radius={[4, 4, 0, 0]} name="Gross Revenue (₹ Lakhs)" />
                  <Bar dataKey="salaryExpense" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Staff Salary Outflow (₹ Lakhs)" />
                  <Bar dataKey="operationalExpense" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Operating Overhead (₹ Lakhs)" />
                  <Bar dataKey="netProfit" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Operating Profit (₹ Lakhs)" />
                  <Bar dataKey="govtTaxAdvantage" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Govt Tax & GST Advantage (₹ Lakhs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Financial Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Financial Breakdown Ledger ({dateFilter === 'TODAY' ? 'Today' : dateFilter === 'THIS_MONTH' ? 'This Month' : 'This Year'})
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timeframe / Period</th>
                    <th className="p-3">Gross Revenue (₹)</th>
                    <th className="p-3 text-rose-300">Staff Salary Outflow (₹)</th>
                    <th className="p-3 text-amber-300">Operating Overhead (₹)</th>
                    <th className="p-3 text-rose-300">Total Outflow (₹)</th>
                    <th className="p-3 text-emerald-300">Net Operating Profit (₹)</th>
                    <th className="p-3 text-purple-300">Govt Tax Advantage (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dynamicFinancialsChart.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition font-semibold">
                      <td className="p-3 font-black text-slate-900">{f.label}</td>
                      <td className="p-3 font-extrabold text-blue-700">₹{(f.revenue * 100000).toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-700">₹{(f.salaryExpense * 100000).toLocaleString()}</td>
                      <td className="p-3 font-bold text-amber-700">₹{(f.operationalExpense * 100000).toLocaleString()}</td>
                      <td className="p-3 font-black text-rose-800">₹{(f.totalExpenses * 100000).toLocaleString()}</td>
                      <td className="p-3 font-black text-emerald-700">₹{(f.netProfit * 100000).toLocaleString()}</td>
                      <td className="p-3 font-extrabold text-purple-700">₹{(f.govtTaxAdvantage * 100000).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEDICATED ADMIN-ONLY EARNINGS VS EXPENSES AREA/LINE CHART */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Admin Confidential: Gross Earnings vs Total Expenses Trend ({dateFilter === 'TODAY' ? 'Today' : dateFilter === 'THIS_MONTH' ? 'This Month' : 'This Year'})</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">Strictly Admin Restricted: Gross Earnings (Green Area) vs Total Expenses (Red Area) &amp; Net Profit Curve.</p>
              </div>
              <span className="badge bg-rose-100 text-rose-800 text-[10px] font-black uppercase">Admin Only • Confidential 🔒</span>
            </div>

            <div className="h-[380px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicFinancialsChart} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 800 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 800 }} unit="L" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Gross Earnings (₹ Lakhs)" />
                  <Area type="monotone" dataKey="totalExpenses" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Total Expenses (₹ Lakhs)" />
                  <Line type="monotone" dataKey="netProfit" stroke="#1E6091" strokeWidth={3} dot={{ r: 4 }} name="Net Pure Profit (₹ Lakhs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* BAR GRAPH 3 & 4 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 3: Lead Conversion vs Claims Settlement % */}
        <div 
          onClick={() => setActiveModal('CONVERSION_CLAIMS_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
          title="Click to view category conversion & claim settlement details"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition flex items-center space-x-1.5">
                <span>3. Lead Conversion vs Claims Settlement (%)</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-[11px] text-slate-500">Conversion Rate &amp; Claim Settlement Ratio by Category ({dateFilter})</p>
            </div>
            <span className="badge badge-purple text-[10px]">Category Performance • Click Details 🔍</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMetrics.conversionClaimsChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend />
                <Bar dataKey="leadConversion" fill="#6366F1" radius={[6, 6, 0, 0]} name="Lead Conversion %" />
                <Bar dataKey="claimSettlement" fill="#14B8A6" radius={[6, 6, 0, 0]} name="Claim Settlement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 4: Staff Advisor Performance Targets (HIDDEN FROM STAFF) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <div 
            onClick={() => setActiveModal('STAFF_PERFORMANCE_CHART')}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
            title="Click to view staff advisor leaderboard details"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition flex items-center space-x-1.5">
                  <span>4. Staff Advisor Targets vs Achieved ({dateFilter === 'THIS_YEAR' ? 'Total' : 'Lakhs'})</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
                </h3>
                <p className="text-[11px] text-slate-500">Revenue Contribution per Advisor ({dateFilter})</p>
              </div>
              <span className="badge badge-amber text-[10px]">Staff Leaderboard • Click Details 🔍</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentMetrics.staffPerformanceChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Legend />
                  <Bar dataKey="target" fill="#94A3B8" radius={[6, 6, 0, 0]} name="Target" />
                  <Bar dataKey="achieved" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Achieved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* GRAPH 5: Product Portfolio Distribution Donut Chart (HIDDEN FROM STAFF) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div 
          onClick={() => setActiveModal('PRODUCT_DISTRIBUTION_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-brand hover:shadow-md transition cursor-pointer group"
          title="Click to view detailed product share breakdown"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5">
                <span>5. Insurance &amp; Financial Portfolio Share (%)</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-[11px] text-slate-500">Distribution across Health, Life, SIP, FDs &amp; Real Estate ({dateFilter})</p>
            </div>
            <span className="badge badge-brand text-[10px]">Product Mix • Click Details 🔍</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentMetrics.productDistributionChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {currentMetrics.productDistributionChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
