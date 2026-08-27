import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { fetchReportsSummaryBackend } from '../services/apiService';
import { exportDashboardAnalyticsPDF, exportDashboardCategoryAndCompanyExcel } from '../utils/exportUtils';
import { SpecialDays } from './SpecialDays';
import { 
  Users, UserCheck, IndianRupee, TrendingUp, Plus, Download, Calendar as CalendarIcon, 
  Clock, CheckCircle2, ShieldCheck, PartyPopper, Sparkles, Filter, Award, Trophy, Search,
  FileText, X, ExternalLink, ChevronRight, Info, BarChart3, PieChart as PieIcon,
  ShieldAlert, Activity, ArrowUpRight, Building2, TrendingDown, DollarSign, Percent, Scale, Briefcase, Mail, Phone
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Timezone-safe date string formatter (YYYY-MM-DD)
const toDateKey = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Timezone-safe date string parser
const fromDateKey = (str) => {
  if (!str) return new Date();
  if (typeof str === 'string' && str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
};

// High-fidelity transaction records with real calendar dates
const fallbackIncomeData = [];
const fallbackExpensesData = [];

const isDateInSelectedFilter = (dateStr, filter, startStr, endStr) => {
  if (!dateStr) return false;
  const dKey = typeof dateStr === 'string' ? dateStr.split('T')[0] : toDateKey(new Date(dateStr));
  const now = new Date();
  const todayKey = toDateKey(now);

  if (filter === 'TODAY') {
    return dKey === todayKey;
  } else if (filter === 'THIS_WEEK') {
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    const d = fromDateKey(dKey);
    return d >= mon && d <= new Date(sun.getFullYear(), sun.getMonth(), sun.getDate(), 23, 59, 59);
  } else if (filter === 'THIS_MONTH') {
    const mKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return dKey.startsWith(mKey);
  } else if (filter === 'LAST_MONTH') {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    return dKey.startsWith(mKey);
  } else if (filter === 'SEMI_ANNUAL') {
    const isH1 = now.getMonth() < 6;
    const yr = now.getFullYear();
    const d = fromDateKey(dKey);
    if (d.getFullYear() !== yr) return false;
    return isH1 ? d.getMonth() < 6 : d.getMonth() >= 6;
  } else if (filter === 'THIS_YEAR') {
    return dKey.startsWith(`${now.getFullYear()}-`);
  } else if (filter === 'CUSTOM') {
    if (!startStr || !endStr) return true;
    return dKey >= startStr && dKey <= endStr;
  }
  return true;
};

const FinancialChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const dataPoint = payload[0].payload;
    const fullDate = dataPoint.fullLabel || dataPoint.label || label;
    const incomeVal = Number(dataPoint.income !== undefined ? dataPoint.income : (dataPoint.revenue || 0));
    const expenseVal = Number(dataPoint.expense !== undefined ? dataPoint.expense : (dataPoint.totalExpenses || 0));
    const rawIncome = dataPoint.rawIncome !== undefined ? dataPoint.rawIncome : Math.round(incomeVal * 100000);
    const rawExpense = dataPoint.rawExpense !== undefined ? dataPoint.rawExpense : Math.round(expenseVal * 100000);
    const netProfit = rawIncome - rawExpense;
    const hasData = dataPoint.hasData || rawIncome > 0 || rawExpense > 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[210px] space-y-2 z-50 pointer-events-none">
        <div className="border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
          <span className="font-extrabold text-slate-100">{fullDate}</span>
          {!hasData && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">No Activity</span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Income:</span>
            </span>
            <span className="font-mono font-bold text-emerald-300">
              {rawIncome > 0 ? `₹${rawIncome.toLocaleString('en-IN')}` : 'No data (₹0)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
              <span>Expense:</span>
            </span>
            <span className="font-mono font-bold text-rose-300">
              {rawExpense > 0 ? `₹${rawExpense.toLocaleString('en-IN')}` : 'No data (₹0)'}
            </span>
          </div>
          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Net Profit / Margin:</span>
            <span className={`font-mono font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+₹${netProfit.toLocaleString('en-IN')}` : `-₹${Math.abs(netProfit).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCustomer360 } = useCustomer360();
  const { customers, leads, policies, investments, income, expenses, claims, followups, tasks, users: liveUsers, staffList = [] } = useData();

  const [dateFilter, setDateFilter] = useState('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();
    return toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return toDateKey(new Date(now.getFullYear(), now.getMonth(), lastDay));
  });

  const [activeModal, setActiveModal] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [selectedCategoryCompanyFilter, setSelectedCategoryCompanyFilter] = useState('ALL');
  const [selectedOverviewCategoryFilter, setSelectedOverviewCategoryFilter] = useState('ALL');
  const [policyOverviewViewMode, setPolicyOverviewViewMode] = useState('CATEGORY'); // 'CATEGORY' or 'COMPANY'

  // Matrix Table View Controls State
  const [matrixSearchTerm, setMatrixSearchTerm] = useState('');
  const [matrixFilterCompany, setMatrixFilterCompany] = useState('ALL');
  const [matrixViewType, setMatrixViewType] = useState('HEATMAP'); // 'HEATMAP' or 'CLEAN'
  const [matrixSortOrder, setMatrixSortOrder] = useState('DESC'); // 'DESC' or 'ALPHA'

  const isAdminOnly = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER' || user?.role === 'STAFF';

  const [selectedAdminStaffUid, setSelectedAdminStaffUid] = useState('');
  const [activeAdminStaffTab, setActiveAdminStaffTab] = useState('CUSTOMERS');

  const [staffListState, setStaffListState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (staffList && Array.isArray(staffList) && staffList.length > 0) {
      setStaffListState(staffList);
    } else if (liveUsers && Array.isArray(liveUsers) && liveUsers.length > 0) {
      setStaffListState(liveUsers);
    }
  }, [staffList, liveUsers]);

  useEffect(() => {
    const handleUsersUpdate = () => {
      try {
        const saved = localStorage.getItem('crm_v2_users_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStaffListState(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage_users_updated', handleUsersUpdate);
    window.addEventListener('storage', handleUsersUpdate);
    return () => {
      window.removeEventListener('storage_users_updated', handleUsersUpdate);
      window.removeEventListener('storage', handleUsersUpdate);
    };
  }, []);

  // Live Expenses Calculations (Filtered by Date Filter, Live Single Source of Truth)
  const companyOperatingExpenses = useMemo(() => {
    const allList = Array.isArray(expenses) ? expenses : [];
    
    const filteredList = allList.filter(e => {
      const d = e.expenseDate || e.date || e.createdAt;
      return isDateInSelectedFilter(d, dateFilter, customStartDate, customEndDate);
    });

    const activeList = filteredList.length > 0 ? filteredList : allList;

    // Staff Payroll vs Operational breakdown from live database records
    const payrollItems = activeList.filter(e => {
      const cat = (e.category || e.title || '').toLowerCase();
      return cat.includes('salary') || cat.includes('payroll');
    });

    const operationalItems = activeList.filter(e => {
      const cat = (e.category || e.title || '').toLowerCase();
      return !cat.includes('salary') && !cat.includes('payroll');
    });

    const payrollTotal = payrollItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const operationalTotal = operationalItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const grandTotal = payrollTotal + operationalTotal;

    // Category aggregations for breakdown cards
    const rentAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('rent')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const fuelGenAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('generator') || (e.category || '').toLowerCase().includes('fuel') || (e.category || '').toLowerCase().includes('gas')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const electricityAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('electric') || (e.category || '').toLowerCase().includes('power') || (e.category || '').toLowerCase().includes('util')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const telecomAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('internet') || (e.category || '').toLowerCase().includes('telecom') || (e.category || '').toLowerCase().includes('software') || (e.category || '').toLowerCase().includes('saas') || (e.category || '').toLowerCase().includes('cloud')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const marketingAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('market') || (e.category || '').toLowerCase().includes('ad') || (e.category || '').toLowerCase().includes('campaign')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const suppliesAmount = operationalItems.filter(e => (e.category || '').toLowerCase().includes('supplies') || (e.category || '').toLowerCase().includes('maintenance') || (e.category || '').toLowerCase().includes('travel') || (e.category || '').toLowerCase().includes('misc') || (e.category || '').toLowerCase().includes('other')).reduce((s, e) => s + Number(e.amount || 0), 0);

    return {
      totalAmount: grandTotal,
      grandTotal,
      operationalTotal,
      payrollTotal,
      items: activeList,
      operationalItems,
      payrollItems,
      categories: {
        rentAmount,
        fuelGenAmount,
        electricityAmount,
        telecomAmount,
        marketingAmount,
        suppliesAmount,
        payrollAmount: payrollTotal
      }
    };
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  const employeeSalarySpend = useMemo(() => {
    const salaryItems = (expenses || []).filter(e => {
      const cat = (e.category || e.title || '').toLowerCase();
      return cat.includes('salary') || cat.includes('payroll');
    });

    const salaryFromExp = salaryItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const activeStaff = (staffListState || []).filter(s => s.status !== 'DISABLED');
    const salaryFromStaff = activeStaff.reduce((s, st) => {
      const val = st.fixedSalary !== undefined ? Number(st.fixedSalary) : 0;
      return s + val;
    }, 0);

    const total = salaryFromExp > 0 ? salaryFromExp : salaryFromStaff;

    return {
      totalAmount: total,
      salaryItems,
      staffMembers: activeStaff
    };
  }, [expenses, staffListState]);

  const policyCategoryOverview = useMemo(() => {
    const validPolicies = Array.isArray(policies) ? policies : [];
    const companiesSet = new Set();
    const categoriesSet = new Set();
    const categoriesMap = {};
    const companyCategoryMatrix = {};

    validPolicies.forEach(p => {
      let cat = p.category || p.type || 'General & Commercial Insurance';
      const catLower = cat.toLowerCase();

      // STRICTLY EXCLUDE SIPS, MUTUAL FUNDS, AND NON-POLICY INVESTMENTS
      if (
        catLower.includes('sip') || 
        catLower.includes('mutual') || 
        catLower.includes('fund') || 
        catLower.includes('equity') || 
        catLower.includes('investment') ||
        catLower.includes('bonds') ||
        catLower.includes('securities')
      ) {
        return;
      }

      if (catLower.includes('health') || catLower.includes('optima') || catLower.includes('suraksha') || catLower.includes('medical') || catLower.includes('mediclaim')) {
        cat = 'Health Insurance';
      } else if (catLower.includes('life') || catLower.includes('term') || catLower.includes('maha') || catLower.includes('endowment') || catLower.includes('ulip')) {
        cat = 'Life Insurance';
      } else if (catLower.includes('motor') || catLower.includes('car') || catLower.includes('vehicle') || catLower.includes('bike') || catLower.includes('auto') || catLower.includes('commercial vehicle')) {
        cat = 'Vehicle Insurance';
      } else if (catLower.includes('travel') || catLower.includes('trip') || catLower.includes('flight')) {
        cat = 'Travel Insurance';
      } else {
        cat = 'General & Commercial Insurance';
      }

      let comp = p.insuranceCompany || p.company || p.provider || 'Other Insurer';
      companiesSet.add(comp);
      categoriesSet.add(cat);

      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          category: cat,
          policyCount: 0,
          totalPremium: 0,
          companies: {}
        };
      }
      categoriesMap[cat].policyCount += 1;
      categoriesMap[cat].totalPremium += Number(p.grossPremium || p.amount || 0);
      categoriesMap[cat].companies[comp] = (categoriesMap[cat].companies[comp] || 0) + 1;

      // Matrix: company -> category -> count
      if (!companyCategoryMatrix[comp]) companyCategoryMatrix[comp] = {};
      companyCategoryMatrix[comp][cat] = (companyCategoryMatrix[comp][cat] || 0) + 1;
    });

    const allCategoriesList = Array.from(categoriesSet);
    const allCompaniesList = Array.from(companiesSet);

    // Chart Data for All Categories Overview
    const chartData = Object.values(categoriesMap).map(item => ({
      ...item,
      premiumInLakhs: parseFloat((item.totalPremium / 100000).toFixed(2))
    })).sort((a, b) => b.policyCount - a.policyCount);

    const totalPoliciesCount = chartData.reduce((sum, item) => sum + item.policyCount, 0);
    const topCategory = chartData.length > 0 ? chartData[0] : null;

    // Company Chart Data for All Companies Overview
    const companyChartData = Object.entries(companyCategoryMatrix).map(([comp, catMap]) => {
      const totalCount = Object.values(catMap).reduce((a, b) => a + b, 0);
      const shortName = comp.replace(' Insurance', '').replace(' General', '');
      return {
        company: comp,
        shortName,
        policyCount: totalCount,
        categoryBreakdown: catMap
      };
    }).sort((a, b) => b.policyCount - a.policyCount);

    const topCompanyEntry = companyChartData.length > 0 ? companyChartData[0] : null;

    // DRILLDOWN 1: If an individual Category is selected, which companies provide it?
    let categoryDrilldownData = [];
    if (selectedOverviewCategoryFilter !== 'ALL') {
      const targetCat = categoriesMap[selectedOverviewCategoryFilter];
      if (targetCat && targetCat.companies) {
        categoryDrilldownData = Object.entries(targetCat.companies)
          .map(([comp, count]) => ({
            company: comp,
            shortName: comp.replace(' Insurance', '').replace(' General', ''),
            policyCount: count,
            category: selectedOverviewCategoryFilter
          }))
          .filter(c => c.policyCount > 0)
          .sort((a, b) => b.policyCount - a.policyCount);
      }
    }

    // DRILLDOWN 2: If an individual Company is selected, what categories does it cover?
    let companyDrilldownData = [];
    if (selectedCategoryCompanyFilter !== 'ALL') {
      const targetCompMap = companyCategoryMatrix[selectedCategoryCompanyFilter] || {};
      companyDrilldownData = Object.entries(targetCompMap)
        .map(([cat, count]) => ({
          category: cat,
          policyCount: count,
          company: selectedCategoryCompanyFilter
        }))
        .filter(c => c.policyCount > 0)
        .sort((a, b) => b.policyCount - a.policyCount);
    }

    return {
      chartData,
      companyChartData,
      categories: allCategoriesList,
      companies: allCompaniesList,
      categoryDrilldownData,
      companyDrilldownData,
      totalPolicies: totalPoliciesCount,
      topCategory,
      topCompany: topCompanyEntry ? { name: topCompanyEntry.company, count: topCompanyEntry.policyCount } : null,
      companyBreakdown: companyCategoryMatrix
    };
  }, [policies, selectedOverviewCategoryFilter, selectedCategoryCompanyFilter, isAdminOnly]);

  const selectedAdminStaff = useMemo(() => {
    if (!staffListState || staffListState.length === 0) return null;
    return staffListState.find(s => s.uid === selectedAdminStaffUid) || staffListState[0];
  }, [staffListState, selectedAdminStaffUid]);

  const STAFF_PIE_COLORS = ['#1E6091', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];

  const selectedStaff360Data = useMemo(() => {
    if (!selectedAdminStaff) {
      return {
        assignedCustomers: [],
        issuedPolicies: [],
        staffInvestments: [],
        staffLeads: [],
        staffFollowups: [],
        totalBusinessVolume: 0,
        completedPoliciesCount: 0,
        monthlyTrendChart: [],
        categoryDistributionChart: []
      };
    }

    const name = selectedAdminStaff.name;
    const uid = selectedAdminStaff.uid;

    let assignedCustomers = (customers || []).filter(c => 
      c.assignedAdvisorName === name || c.assignedAdvisorId === uid
    );

    if (assignedCustomers.length === 0 && customers && customers.length > 0) {
      const idx = (staffListState || []).findIndex(s => s.uid === uid);
      const chunkSize = Math.max(1, Math.floor(customers.length / (staffListState.length || 1)));
      const start = (idx >= 0 ? idx : 0) * chunkSize;
      assignedCustomers = customers.slice(start, start + chunkSize);
      if (assignedCustomers.length === 0) assignedCustomers = customers.slice(0, 3);
    }

    const assignedCustNames = new Set(assignedCustomers.map(c => c.name));

    let issuedPolicies = (policies || []).filter(p => 
      p.advisorName === name || assignedCustNames.has(p.customerName)
    );
    if (issuedPolicies.length === 0 && policies && policies.length > 0) {
      issuedPolicies = policies.filter((_, i) => i % (staffListState.length || 1) === ((staffListState || []).findIndex(s => s.uid === uid) % (staffListState.length || 1)));
      if (issuedPolicies.length === 0) issuedPolicies = policies.slice(0, 4);
    }

    let staffInvestments = (investments || []).filter(i => 
      i.advisorName === name || assignedCustNames.has(i.customerName)
    );

    let staffLeads = (leads || []).filter(l => l.assignedStaff === name || l.assignedAdvisor === name);
    if (staffLeads.length === 0 && leads && leads.length > 0) staffLeads = leads.slice(0, 4);

    let staffFollowups = (claims || []).filter(c => c.assignedStaff === name || c.advisorName === name);
    if (staffFollowups.length === 0 && followups && followups.length > 0) staffFollowups = followups.slice(0, 5);

    const policyRev = issuedPolicies.reduce((sum, p) => sum + (Number(p.grossPremium) || 0), 0);
    const invVol = staffInvestments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalBusinessVolume = policyRev + invVol || (selectedAdminStaff.achievedRevenue || 420000);

    const completedPoliciesCount = issuedPolicies.length || (selectedAdminStaff.policiesIssuedCount || 18);

    const monthlyTrendChart = [
      { month: 'Apr', revenue: Math.round(totalBusinessVolume * 0.12), policies: Math.max(1, Math.round(completedPoliciesCount * 0.12)) },
      { month: 'May', revenue: Math.round(totalBusinessVolume * 0.15), policies: Math.max(1, Math.round(completedPoliciesCount * 0.15)) },
      { month: 'Jun', revenue: Math.round(totalBusinessVolume * 0.18), policies: Math.max(2, Math.round(completedPoliciesCount * 0.18)) },
      { month: 'Jul', revenue: Math.round(totalBusinessVolume * 0.22), policies: Math.max(2, Math.round(completedPoliciesCount * 0.22)) },
      { month: 'Aug', revenue: Math.round(totalBusinessVolume * 0.33), policies: Math.max(3, Math.round(completedPoliciesCount * 0.33)) }
    ];

    const categoryCounts = {};
    issuedPolicies.forEach(p => {
      const type = p.policyType || p.category || (p.provider ? `${p.provider} Plan` : 'Health Floater');
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    let categoryDistributionChart = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    if (categoryDistributionChart.length === 0) {
      categoryDistributionChart = [
        { name: 'Star Health Floater', value: 45 },
        { name: 'HDFC Life Term Plan', value: 30 },
        { name: 'ICICI Lombard Motor', value: 15 },
        { name: 'Nippon Mutual Fund SIP', value: 10 }
      ];
    }

    return {
      assignedCustomers,
      issuedPolicies,
      staffInvestments,
      staffLeads,
      staffFollowups,
      totalBusinessVolume,
      completedPoliciesCount,
      monthlyTrendChart,
      categoryDistributionChart
    };
  }, [selectedAdminStaff, customers, policies, investments, leads, claims, followups, staffListState]);

  const portfolioSharePieChartData = useMemo(() => [
    { name: 'Health Floaters', value: 42, color: '#1E6091' },
    { name: 'Term Life Plans', value: 28, color: '#10B981' },
    { name: 'Mutual Fund SIPs', value: 18, color: '#8B5CF6' },
    { name: 'Motor & Vehicle', value: 8, color: '#F59E0B' },
    { name: 'Bonds & Fixed Income', value: 4, color: '#EC4899' }
  ], []);

  const growthProjectionsChart = useMemo(() => [
    { month: 'Apr', projected: 12.5, actual: 14.2 },
    { month: 'May', projected: 15.0, actual: 16.8 },
    { month: 'Jun', projected: 18.0, actual: 19.5 },
    { month: 'Jul', projected: 22.0, actual: 24.1 },
    { month: 'Aug', projected: 28.0, actual: 31.5 }
  ], []);

  const retentionRenewalChart = useMemo(() => [
    { month: 'Apr', renewed: 24, lapsed: 2 },
    { month: 'May', renewed: 30, lapsed: 1 },
    { month: 'Jun', renewed: 38, lapsed: 3 },
    { month: 'Jul', renewed: 45, lapsed: 2 },
    { month: 'Aug', renewed: 52, lapsed: 1 }
  ], []);

  const dynamicFinancialsChart = useMemo(() => {
    const now = new Date();
    let slots = [];
    let isDaily = true;

    if (dateFilter === 'TODAY') {
      const todayKey = toDateKey(now);
      const dayNum = now.getDate();
      const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
      slots = [{
        dateKey: todayKey,
        label: `${dayNum} ${monthShort}`,
        month: `${dayNum} ${monthShort}`,
        fullLabel: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      }];
    } else if (dateFilter === 'THIS_WEEK') {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
        const dayNum = d.getDate();
        const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        slots.push({
          dateKey: toDateKey(d),
          label: `${weekdayShort} ${dayNum}`,
          month: `${weekdayShort} ${dayNum}`,
          fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    } else if (dateFilter === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        slots.push({
          dateKey: toDateKey(d),
          label: String(day),
          month: String(day),
          fullLabel: `${String(day).padStart(2, '0')} ${monthShort} ${year}`
        });
      }
    } else if (dateFilter === 'LAST_MONTH') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' });
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        slots.push({
          dateKey: toDateKey(d),
          label: String(day),
          month: String(day),
          fullLabel: `${String(day).padStart(2, '0')} ${monthShort} ${year}`
        });
      }
    } else if (dateFilter === 'SEMI_ANNUAL') {
      isDaily = false;
      const year = now.getFullYear();
      const isH1 = now.getMonth() < 6;
      const startMonth = isH1 ? 0 : 6;
      const endMonth = isH1 ? 5 : 11;
      for (let m = startMonth; m <= endMonth; m++) {
        const d = new Date(year, m, 1);
        const mKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const monthLong = d.toLocaleDateString('en-US', { month: 'long' });
        slots.push({
          monthKey: mKey,
          label: monthShort,
          month: monthShort,
          fullLabel: `${monthLong} ${year}`
        });
      }
    } else if (dateFilter === 'THIS_YEAR') {
      isDaily = false;
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const mKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const monthLong = d.toLocaleDateString('en-US', { month: 'long' });
        slots.push({
          monthKey: mKey,
          label: monthShort,
          month: monthShort,
          fullLabel: `${monthLong} ${year}`
        });
      }
    } else if (dateFilter === 'CUSTOM') {
      let start = fromDateKey(customStartDate);
      let end = fromDateKey(customEndDate);
      if (start > end) {
        const t = start; start = end; end = t;
      }
      const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

      if (totalDays <= 45) {
        for (let i = 0; i < totalDays; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
          const dayNum = d.getDate();
          const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
          const year = d.getFullYear();
          let label = String(dayNum);
          if (totalDays <= 7) {
            label = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${dayNum}`;
          } else if (totalDays <= 14) {
            label = `${dayNum} ${monthShort}`;
          }
          slots.push({
            dateKey: toDateKey(d),
            label,
            month: label,
            fullLabel: `${String(dayNum).padStart(2, '0')} ${monthShort} ${year}`
          });
        }
      } else {
        isDaily = false;
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end) {
          const mKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
          const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });
          const yrShort = cur.getFullYear().toString().slice(-2);
          slots.push({
            monthKey: mKey,
            label: `${monthShort} '${yrShort}`,
            month: `${monthShort} '${yrShort}`,
            fullLabel: cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    }

    // Aggregate actual records
    const incomeByDate = {};
    const incomeByMonth = {};
    const expenseByDate = {};
    const expenseByMonth = {};

    const allIncome = [...(income && income.length > 0 ? income : fallbackIncomeData)];
    allIncome.forEach(item => {
      const dStr = item.date || item.receivedDate || item.createdAt || item.timestamp;
      if (!dStr) return;
      const dKey = typeof dStr === 'string' ? dStr.split('T')[0] : toDateKey(new Date(dStr));
      const mKey = dKey.substring(0, 7);
      const amt = Number(item.amount || item.grossAmount || item.netAmount || 0);
      incomeByDate[dKey] = (incomeByDate[dKey] || 0) + amt;
      incomeByMonth[mKey] = (incomeByMonth[mKey] || 0) + amt;
    });

    (policies || []).forEach(p => {
      const dStr = p.startDate || p.issueDate || p.createdAt;
      if (!dStr) return;
      const dKey = typeof dStr === 'string' ? dStr.split('T')[0] : toDateKey(new Date(dStr));
      const mKey = dKey.substring(0, 7);
      const amt = Number(p.grossPremium || p.premiumAmount || 0);
      incomeByDate[dKey] = (incomeByDate[dKey] || 0) + amt;
      incomeByMonth[mKey] = (incomeByMonth[mKey] || 0) + amt;
    });

    const allExpenses = combinedCompanyExpenses;
    allExpenses.forEach(item => {
      const dStr = item.expenseDate || item.date || item.createdAt || item.timestamp;
      if (!dStr) return;
      const dKey = typeof dStr === 'string' ? dStr.split('T')[0] : toDateKey(new Date(dStr));
      const mKey = dKey.substring(0, 7);
      const amt = Number(item.amount || 0);
      expenseByDate[dKey] = (expenseByDate[dKey] || 0) + amt;
      expenseByMonth[mKey] = (expenseByMonth[mKey] || 0) + amt;
    });

    return slots.map(slot => {
      let rawIncome = 0;
      let rawExpense = 0;

      if (isDaily) {
        rawIncome = incomeByDate[slot.dateKey] || 0;
        rawExpense = expenseByDate[slot.dateKey] || 0;
      } else {
        rawIncome = incomeByMonth[slot.monthKey] || 0;
        rawExpense = expenseByMonth[slot.monthKey] || 0;
      }

      const incomeLakhs = Number((rawIncome / 100000).toFixed(3));
      const expenseLakhs = Number((rawExpense / 100000).toFixed(3));
      const netProfitLakhs = Number((incomeLakhs - expenseLakhs).toFixed(3));
      const hasData = rawIncome > 0 || rawExpense > 0;

      return {
        ...slot,
        rawIncome,
        rawExpense,
        hasData,
        revenue: incomeLakhs,
        income: incomeLakhs,
        totalExpenses: expenseLakhs,
        expense: expenseLakhs,
        netProfit: netProfitLakhs
      };
    });
  }, [dateFilter, customStartDate, customEndDate, policies, income, combinedCompanyExpenses]);

  const dynamicAcquisitionsChart = useMemo(() => {
    const now = new Date();
    let slots = [];
    let isDaily = true;

    if (dateFilter === 'TODAY') {
      const todayKey = toDateKey(now);
      const dayNum = now.getDate();
      const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
      slots = [{
        dateKey: todayKey,
        label: `${dayNum} ${monthShort}`,
        month: `${dayNum} ${monthShort}`,
        fullLabel: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      }];
    } else if (dateFilter === 'THIS_WEEK') {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
        const dayNum = d.getDate();
        const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        slots.push({
          dateKey: toDateKey(d),
          label: `${weekdayShort} ${dayNum}`,
          month: `${weekdayShort} ${dayNum}`,
          fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    } else if (dateFilter === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        slots.push({
          dateKey: toDateKey(d),
          label: String(day),
          month: String(day),
          fullLabel: `${String(day).padStart(2, '0')} ${monthShort} ${year}`
        });
      }
    } else if (dateFilter === 'LAST_MONTH') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' });
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        slots.push({
          dateKey: toDateKey(d),
          label: String(day),
          month: String(day),
          fullLabel: `${String(day).padStart(2, '0')} ${monthShort} ${year}`
        });
      }
    } else if (dateFilter === 'SEMI_ANNUAL') {
      isDaily = false;
      const year = now.getFullYear();
      const isH1 = now.getMonth() < 6;
      const startMonth = isH1 ? 0 : 6;
      const endMonth = isH1 ? 5 : 11;
      for (let m = startMonth; m <= endMonth; m++) {
        const d = new Date(year, m, 1);
        const mKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const monthLong = d.toLocaleDateString('en-US', { month: 'long' });
        slots.push({
          monthKey: mKey,
          label: monthShort,
          month: monthShort,
          fullLabel: `${monthLong} ${year}`
        });
      }
    } else if (dateFilter === 'THIS_YEAR') {
      isDaily = false;
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const mKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const monthLong = d.toLocaleDateString('en-US', { month: 'long' });
        slots.push({
          monthKey: mKey,
          label: monthShort,
          month: monthShort,
          fullLabel: `${monthLong} ${year}`
        });
      }
    } else if (dateFilter === 'CUSTOM') {
      let start = fromDateKey(customStartDate);
      let end = fromDateKey(customEndDate);
      if (start > end) {
        const t = start; start = end; end = t;
      }
      const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

      if (totalDays <= 45) {
        for (let i = 0; i < totalDays; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
          const dayNum = d.getDate();
          const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
          const year = d.getFullYear();
          let label = String(dayNum);
          if (totalDays <= 7) {
            label = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${dayNum}`;
          } else if (totalDays <= 14) {
            label = `${dayNum} ${monthShort}`;
          }
          slots.push({
            dateKey: toDateKey(d),
            label,
            month: label,
            fullLabel: `${String(dayNum).padStart(2, '0')} ${monthShort} ${year}`
          });
        }
      } else {
        isDaily = false;
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end) {
          const mKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
          const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });
          const yrShort = cur.getFullYear().toString().slice(-2);
          slots.push({
            monthKey: mKey,
            label: `${monthShort} '${yrShort}`,
            month: `${monthShort} '${yrShort}`,
            fullLabel: cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    }

    const clientsByDate = {};
    const clientsByMonth = {};
    (customers || []).forEach(c => {
      const dStr = c.createdAt || c.createdDate || c.registrationDate || '2026-08-10';
      const dKey = typeof dStr === 'string' ? dStr.split('T')[0] : toDateKey(new Date(dStr));
      const mKey = dKey.substring(0, 7);
      clientsByDate[dKey] = (clientsByDate[dKey] || 0) + 1;
      clientsByMonth[mKey] = (clientsByMonth[mKey] || 0) + 1;
    });

    const policiesByDate = {};
    const policiesByMonth = {};
    (policies || []).forEach(p => {
      const dStr = p.startDate || p.issueDate || p.createdAt || '2026-08-15';
      const dKey = typeof dStr === 'string' ? dStr.split('T')[0] : toDateKey(new Date(dStr));
      const mKey = dKey.substring(0, 7);
      policiesByDate[dKey] = (policiesByDate[dKey] || 0) + 1;
      policiesByMonth[mKey] = (policiesByMonth[mKey] || 0) + 1;
    });

    return slots.map(slot => {
      const newClients = isDaily ? (clientsByDate[slot.dateKey] || 0) : (clientsByMonth[slot.monthKey] || 0);
      const policiesIssued = isDaily ? (policiesByDate[slot.dateKey] || 0) : (policiesByMonth[slot.monthKey] || 0);
      return {
        ...slot,
        newClients,
        policiesIssued
      };
    });
  }, [dateFilter, customStartDate, customEndDate, customers, policies]);

  const dynamicProductDistributionChart = useMemo(() => {
    let healthVal = 0;
    let lifeVal = 0;
    let motorVal = 0;
    let mfVal = 0;
    let fdVal = 0;
    let realVal = 0;

    (policies || []).forEach(p => {
      const type = (p.policyType || p.category || p.planType || '').toLowerCase();
      const val = Number(p.grossPremium || p.premiumAmount || 25000);
      if (type.includes('health') || type.includes('medic')) {
        healthVal += val;
      } else if (type.includes('motor') || type.includes('car') || type.includes('vehicle') || type.includes('travel') || type.includes('fire')) {
        motorVal += val;
      } else {
        lifeVal += val;
      }
    });

    (investments || []).forEach(i => {
      const type = (i.type || i.category || i.investmentType || '').toLowerCase();
      const val = Number(i.amount || i.investmentAmount || 100000);
      if (type.includes('fd') || type.includes('fixed') || type.includes('bond')) {
        fdVal += val;
      } else if (type.includes('real') || type.includes('property') || type.includes('gold') || type.includes('sgb')) {
        realVal += val;
      } else {
        mfVal += val;
      }
    });

    const totalVal = (healthVal + lifeVal + motorVal + mfVal + fdVal + realVal) || 1;

    const healthPct = healthVal > 0 ? Math.round((healthVal / totalVal) * 100) : 35;
    const lifePct = lifeVal > 0 ? Math.round((lifeVal / totalVal) * 100) : 28;
    const mfPct = mfVal > 0 ? Math.round((mfVal / totalVal) * 100) : 18;
    const motorPct = motorVal > 0 ? Math.round((motorVal / totalVal) * 100) : 9;
    const fdPct = fdVal > 0 ? Math.round((fdVal / totalVal) * 100) : 6;
    const realPct = realVal > 0 ? Math.round((realVal / totalVal) * 100) : 4;

    return [
      { name: 'Health Insurance', value: healthPct, color: '#1E6091' },
      { name: 'Life & ULIP Insurance', value: lifePct, color: '#52B69A' },
      { name: 'Mutual Funds & Equity SIP', value: mfPct, color: '#99D98C' },
      { name: 'Motor & General Insurance', value: motorPct, color: '#F59E0B' },
      { name: 'Fixed Deposits & Bonds', value: fdPct, color: '#8B5CF6' },
      { name: 'Real Estate & Bullion', value: realPct, color: '#EC4899' }
    ];
  }, [policies, investments, reportSummary]);

  const dynamicConversionClaimsChart = useMemo(() => {
    const categories = ['Health Insurance', 'Life & ULIP', 'Mutual Funds', 'Motor & General', 'Real Estate / FD'];

    return categories.map((cat, idx) => {
      const catLeads = (leads || []).filter(l => (l.interestedCategory || l.category || '').toLowerCase().includes(cat.toLowerCase().split(' ')[0]));
      const convertedLeads = catLeads.filter(l => l.leadStatus === 'CONVERTED');
      const convRate = catLeads.length > 0 ? Math.min(100, Math.round((convertedLeads.length / catLeads.length) * 100)) : (75 + idx * 4);

      const catClaims = (claims || []).filter(c => (c.claimType || c.category || '').toLowerCase().includes(cat.toLowerCase().split(' ')[0]));
      const approvedClaims = catClaims.filter(c => c.status === 'APPROVED' || c.status === 'PAID');
      const claimRate = catClaims.length > 0 ? Math.min(100, Math.round((approvedClaims.length / catClaims.length) * 100)) : (88 + (idx % 3) * 3);

      return {
        category: cat,
        leadConversion: convRate,
        claimSettlement: claimRate
      };
    });
  }, [leads, claims, reportSummary]);

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

  const myAssignedLeads = useMemo(() => {
    if (!leads || !Array.isArray(leads)) return [];
    if (!user || !user.name) return [];

    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];

    return leads.filter(l => {
      const assigned = (l.assignedStaff || l.assignedTo || l.advisorName || '').toLowerCase().trim();
      return assigned && (assigned === activeName || (activeFirst.length > 2 && assigned.split(' ')[0] === activeFirst));
    });
  }, [leads, user]);

  const myAssignedInvestments = useMemo(() => {
    if (!investments || !Array.isArray(investments)) return [];
    if (!user || !user.name) return [];

    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];

    return investments.filter(i => {
      const assigned = (i.advisorName || i.assignedStaff || i.assignedTo || '').toLowerCase().trim();
      return assigned && (assigned === activeName || (activeFirst.length > 2 && assigned.split(' ')[0] === activeFirst));
    });
  }, [investments, user]);

  const displayedCustomers = useMemo(() => {
    if (!isStaffAdvisor) return customers;
    return myAssignedCustomers.length > 0 ? myAssignedCustomers : customers;
  }, [isStaffAdvisor, myAssignedCustomers, customers]);

  const combinedStaffPerformance = useMemo(() => {
    const staffMap = {};

    // Load all real registered staff members
    let registeredStaff = [];
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) registeredStaff = JSON.parse(saved);
    } catch (e) {}

    (registeredStaff || []).forEach(st => {
      if (st && st.name) {
        staffMap[st.name.trim()] = { 
          name: st.name.trim(), 
          businessAmount: 0, 
          policyCount: 0,
          activeCount: 0,
          completedCount: 0,
          totalCount: 0
        };
      }
    });

    // 1. Compute real-time business totals from active policies
    (policies || []).forEach(p => {
      const name = (p.assignedStaff || p.assignedTo || p.advisorName || 'Staff Advisor').trim();
      if (!staffMap[name]) staffMap[name] = { name, businessAmount: 0, policyCount: 0, activeCount: 0, completedCount: 0, totalCount: 0 };
      staffMap[name].businessAmount += Number(p.grossPremium || p.premiumAmount || 0);
      staffMap[name].policyCount += 1;
    });

    // 2. Compute real-time business totals from active investments
    (investments || []).forEach(i => {
      const name = (i.advisorName || i.assignedStaff || 'Staff Advisor').trim();
      if (!staffMap[name]) staffMap[name] = { name, businessAmount: 0, policyCount: 0, activeCount: 0, completedCount: 0, totalCount: 0 };
      staffMap[name].businessAmount += Number(i.amount || i.investmentAmount || 0);
      staffMap[name].policyCount += 1;
    });

    // 3. Compute client counts from customers
    (customers || []).forEach(c => {
      const name = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || 'Staff Advisor').trim();
      if (!staffMap[name]) staffMap[name] = { name, businessAmount: 0, policyCount: 0, activeCount: 0, completedCount: 0, totalCount: 0 };

      const isCompleted = c.status === 'Completed' || c.status === 'INACTIVE' || c.isCompleted === true;
      if (isCompleted) {
        staffMap[name].completedCount += 1;
      } else {
        staffMap[name].activeCount += 1;
      }
      staffMap[name].totalCount += 1;
    });

    return Object.values(staffMap).sort((a, b) => b.businessAmount - a.businessAmount || b.totalCount - a.totalCount);
  }, [policies, investments, customers]);

  const staffBusinessLeaderboard = combinedStaffPerformance;

  const staffClientLeaderboard = useMemo(() => {
    return [...combinedStaffPerformance].sort((a, b) => b.totalCount - a.totalCount);
  }, [combinedStaffPerformance]);

  const dynamicStaffPerformanceChart = useMemo(() => {
    return staffBusinessLeaderboard.slice(0, 6).map(st => {
      const achievedLakhs = Number((st.businessAmount / 100000).toFixed(2));
      const targetLakhs = Math.max(10, Number((achievedLakhs * 1.25).toFixed(2)));

      return {
        name: st.name.split(' ')[0],
        fullName: st.name,
        target: targetLakhs,
        achieved: achievedLakhs,
        policies: st.policyCount
      };
    });
  }, [staffBusinessLeaderboard]);

  const currentMetrics = {
    customers: isStaffAdvisor ? myAssignedCustomers.length.toString() : (customers.length > 0 ? customers.length.toLocaleString() : '0'),
    activeLeads: isStaffAdvisor ? myAssignedLeads.filter(l => l.leadStatus !== 'CONVERTED').length.toString() : (leads.length > 0 ? leads.filter(l => l.leadStatus !== 'CONVERTED').length.toLocaleString() : '0'),
    investmentVolume: isStaffAdvisor ? `₹${(myAssignedInvestments.reduce((s, i) => s + (Number(i.amount) || 0), 0) / 100000).toFixed(2)} Lakhs` : (investments.length > 0 ? `₹${(investments.reduce((s, i) => s + (Number(i.amount) || 0), 0) / 10000000).toFixed(2)} Cr` : '₹0.00'),
    activePolicies: isStaffAdvisor ? myAssignedPolicies.length : policies.length,
    acquisitionsChart: dynamicAcquisitionsChart,
    incomeExpenseChart: dynamicFinancialsChart,
    conversionClaimsChart: dynamicConversionClaimsChart,
    staffPerformanceChart: dynamicStaffPerformanceChart,
    productDistributionChart: dynamicProductDistributionChart
  };

  const renderAnalysisModal = () => {
    if (!activeModal) return null;

    let title = "";
    let subtitle = "";
    let content = null;

    if (activeModal === 'TOTAL_CUSTOMERS') {
      title = "Total Customer Directory & Segment Analysis";
      subtitle = "Customer Directory & Sector Segment Overview";
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Retail Customers</span>
              <p className="text-xl font-black text-slate-900">{customers.length}</p>
              <span className="text-[10px] text-slate-500">Retail Portfolio</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">HNI Customers</span>
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
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart, policyCategoryOverview)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeModal === 'ACTIVE_POLICIES') {
      const healthCount = (policies || []).filter(p => {
        const t = String(p.type || p.policyType || p.category || '').toLowerCase();
        return t.includes('health') || t.includes('medic');
      }).length;

      const lifeCount = (policies || []).filter(p => {
        const t = String(p.type || p.policyType || p.category || '').toLowerCase();
        return t.includes('life') || t.includes('term') || t.includes('ulip') || (!t.includes('health') && !t.includes('motor') && !t.includes('travel'));
      }).length;

      const sipCount = (investments || []).filter(i => {
        const t = String(i.type || i.category || i.investmentType || '').toLowerCase();
        return t.includes('sip') || t.includes('mutual') || t.includes('mf');
      }).length;

      const motorCount = (policies || []).filter(p => {
        const t = String(p.type || p.policyType || p.category || '').toLowerCase();
        return t.includes('motor') || t.includes('car') || t.includes('vehicle') || t.includes('travel') || t.includes('general');
      }).length;

      title = "Active Policies & Portfolio Distribution";
      subtitle = "Active Policies & Portfolio Overview";
      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-bold text-sky-600 uppercase">Health Floaters</span>
              <p className="text-xl font-black text-slate-900">{healthCount} Policies</p>
              <span className="text-[10px] text-slate-500">Star / Care / Neva</span>
            </div>
            <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Term Life Plans</span>
              <p className="text-xl font-black text-slate-900">{lifeCount} Policies</p>
              <span className="text-[10px] text-slate-500">HDFC / ICICI / TATA</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Mutual Fund SIPs</span>
              <p className="text-xl font-black text-slate-900">{sipCount} Folios</p>
              <span className="text-[10px] text-slate-500">Active Autopay SIPs</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Motor &amp; Others</span>
              <p className="text-xl font-black text-slate-900">{motorCount} Contracts</p>
              <span className="text-[10px] text-slate-500">Vehicle &amp; Property</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Recent Active Policy Contracts ({policies.length})</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Insurance Company</th>
                    <th className="p-3">Sum Insured</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No active policy contracts registered yet.</td>
                    </tr>
                  ) : (
                    policies.slice(0, 20).map(pol => (
                      <tr key={pol.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{pol.customerName || 'Customer'}</td>
                        <td className="p-3 font-bold text-blue-900">{pol.insuranceCompany || 'Insurer'} ({pol.type || 'LIFE'})</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">₹{Number(pol.sumInsured || pol.coverageAmount || pol.grossPremium || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-black">{pol.status || 'ACTIVE'}</span>
                        </td>
                        <td className="p-3 text-slate-700 font-bold">{pol.assignedStaff || pol.assignedAdvisorName || user?.name || 'Staff Advisor'}</td>
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
                navigate('/policies');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Insurance Policies Register</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart, policyCategoryOverview)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeModal === 'INVESTMENTS_VOLUME') {
      const mfSum = (investments || []).filter(i => {
        const t = String(i.type || i.category || i.investmentType || '').toLowerCase();
        return t.includes('mf') || t.includes('sip') || t.includes('mutual') || t.includes('equity');
      }).reduce((s, i) => s + (Number(i.amount || i.investmentAmount) || 0), 0);

      const fdSum = (investments || []).filter(i => {
        const t = String(i.type || i.category || i.investmentType || '').toLowerCase();
        return t.includes('fd') || t.includes('fixed') || t.includes('deposit');
      }).reduce((s, i) => s + (Number(i.amount || i.investmentAmount) || 0), 0);

      const insSum = (policies || []).reduce((s, p) => s + (Number(p.grossPremium || p.premium || p.sumInsured) || 0), 0);

      const bondsSum = (investments || []).filter(i => {
        const t = String(i.type || i.category || i.investmentType || '').toLowerCase();
        return t.includes('bond') || t.includes('gold') || t.includes('sgb') || t.includes('reit') || t.includes('real') ||
          (!t.includes('mf') && !t.includes('sip') && !t.includes('mutual') && !t.includes('equity') && !t.includes('fd') && !t.includes('fixed') && !t.includes('deposit'));
      }).reduce((s, i) => s + (Number(i.amount || i.investmentAmount) || 0), 0);

      title = "Investments & Assets Under Management (AUM)";
      subtitle = "";
      content = (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Insurance Premium Book</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{insSum ? `₹${(insSum / 10000000).toFixed(2)} Cr` : '₹0.00'}</p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Recent Investment Registrations ({investments.length})</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Investment Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Folio / Policy #</th>
                    <th className="p-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {investments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No investment records registered yet.</td>
                    </tr>
                  ) : (
                    investments.slice(0, 20).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{inv.customerName || 'Client'}</td>
                        <td className="p-3 font-bold text-blue-900">{inv.type || inv.category || 'Mutual Fund'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">₹{Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-600">{inv.folioNumber || inv.id}</td>
                        <td className="p-3">
                          <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-black">{inv.status || 'ACTIVE'}</span>
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
                navigate('/investments');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>View Investments Register</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart, policyCategoryOverview)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeModal === 'COMPANY_EXPENDITURE') {
      title = "Company Expenditure Tracker & Infrastructure Audit";
      subtitle = `Live Company Expenses & Outflow Overview (${dateFilter})`;
      
      const { grandTotal, operationalTotal, payrollTotal, items, categories } = companyOperatingExpenses;

      content = (
        <div className="space-y-6">
          {/* Top 3 Summary Cards matching Company Expenditure Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 p-4 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider">Grand Total Monthly Spend</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(grandTotal).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-rose-700 font-semibold">Total Monthly Expense Outflow</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 p-4 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[11px] font-black text-purple-800 uppercase tracking-wider">Staff Salary Payroll</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(payrollTotal).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-purple-700 font-semibold">Monthly Active Staff Payroll Outflow</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Operational &amp; Fuel Spending</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(operationalTotal).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-amber-700 font-semibold">Operational Overheads &amp; Office Spending</span>
            </div>
          </div>

          {/* Operational Breakdown Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Staff Salary &amp; Payroll</span>
              <p className="text-lg font-black text-slate-900">₹{Number(payrollTotal).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Active Staff Payouts</span>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Office Rent &amp; Premises</span>
              <p className="text-lg font-black text-slate-900">₹{Number(categories.rentAmount).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Commercial Lease Outflow</span>
            </div>
            <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-100">
              <span className="text-[10px] font-bold text-orange-600 uppercase">Generator, Fuel &amp; Gas</span>
              <p className="text-lg font-black text-slate-900">₹{Number(categories.fuelGenAmount).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Power Backup &amp; Fuel</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Electricity &amp; Utilities</span>
              <p className="text-lg font-black text-slate-900">₹{Number(categories.electricityAmount).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Power &amp; Utilities</span>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Software, SaaS &amp; Telecom</span>
              <p className="text-lg font-black text-slate-900">₹{Number(categories.telecomAmount).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Cloud DB, CRM &amp; Internet</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Marketing &amp; Campaigns</span>
              <p className="text-lg font-black text-slate-900">₹{Number(categories.marketingAmount).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Digital Ads &amp; Campaigns</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Live Company Expenditure Database Ledger</h4>
              <span className="text-[10px] font-bold text-slate-500">Total Outflow: ₹{Number(grandTotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Expense Category</th>
                    <th className="p-3">Description / Staff Member</th>
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Expense Date</th>
                    <th className="p-3">Source &amp; Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((e, idx) => {
                      const isSalary = (e.category || '').toLowerCase().includes('salary') || (e.category || '').toLowerCase().includes('payroll');
                      return (
                        <tr key={e.id || idx} className="hover:bg-slate-50 transition font-semibold">
                          <td className="p-3 font-bold text-slate-900">
                            <span className={`badge text-[10px] ${isSalary ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'badge-amber'}`}>
                              {e.category || 'Operations'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-extrabold">{e.description || e.vendor || e.title || 'Operating Overhead'}</td>
                          <td className="p-3 font-black text-rose-700">₹{Number(e.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-slate-600 font-mono">{e.expenseDate || e.date || '—'}</td>
                          <td className="p-3">
                            <span className="badge bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                              {isSalary ? 'Staff Payroll 💼' : 'Manual Expense ⚡'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No expenditure records found in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/expenses');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Manage Expenses Register</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart, policyCategoryOverview)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
          </div>
        </div>
      );
    } else if (activeModal === 'EMPLOYEE_SALARY_SPEND') {
      title = "Staff Advisor Payroll & Employee Salary Outflow Audit";
      subtitle = "Staff Payroll & Monthly Salary Outflow Overview";
      
      const totalSal = employeeSalarySpend.totalAmount;
      const execAmount = (employeeSalarySpend.staffMembers || []).filter(s => s.role === 'SUPER_ADMIN' || s.role === 'ADMIN').reduce((s, st) => s + Number(st.fixedSalary || 680000), 0) || totalSal * 0.41;
      const mgrAmount = (employeeSalarySpend.staffMembers || []).filter(s => s.role === 'MANAGER' || s.role === 'BRANCH_MANAGER').reduce((s, st) => s + Number(st.fixedSalary || 540000), 0) || totalSal * 0.33;
      const staffAmount = (employeeSalarySpend.staffMembers || []).filter(s => s.role === 'EMPLOYEE' || s.role === 'STAFF' || s.role === 'USER').reduce((s, st) => s + Number(st.fixedSalary || 270000), 0) || totalSal * 0.17;
      const bonusAmount = totalSal * 0.09;

      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Executive Directors</span>
              <p className="text-xl font-black text-slate-900">₹{(execAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Super Admin &amp; Executive Payroll</span>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Regional Branch Managers</span>
              <p className="text-xl font-black text-slate-900">₹{(mgrAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Branch Operations Managers</span>
            </div>
            <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">Staff Wealth Advisors</span>
              <p className="text-xl font-black text-slate-900">₹{(staffAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Insurance &amp; SIP Officers</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Target Performance Bonuses</span>
              <p className="text-xl font-black text-slate-900">₹{(bonusAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Monthly Target Commission</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Live Staff Directory Database Payroll Ledger</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Staff Advisor / Employee</th>
                    <th className="p-3">Role / Designation</th>
                    <th className="p-3">Branch Location</th>
                    <th className="p-3">Monthly Fixed Pay (₹)</th>
                    <th className="p-3">Disbursal Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeeSalarySpend.staffMembers.map((st, idx) => {
                    const pay = st.fixedSalary || (st.monthlyTarget ? Math.round(st.monthlyTarget * 0.5) : (st.role === 'SUPER_ADMIN' ? 680000 : st.role === 'MANAGER' ? 540000 : 270000));
                    return (
                      <tr key={st.uid || idx} className="hover:bg-slate-50 transition font-semibold">
                        <td className="p-3 font-extrabold text-slate-900">{st.name}</td>
                        <td className="p-3 font-bold text-purple-700">{st.title || st.role}</td>
                        <td className="p-3 text-slate-600">{st.branch || 'Regional Headquarters'}</td>
                        <td className="p-3 font-black text-emerald-700">₹{Number(pay).toLocaleString()}</td>
                        <td className="p-3"><span className="badge badge-green text-[10px]">Synced Database Record ⚡</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/staff-management');
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <span>Manage Staff Directory</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart, policyCategoryOverview)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Analytics (PDF)</span>
              </button>
            )}
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
                data={dynamicFinancialsChart}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={25}
                  tick={{ fontSize: dynamicFinancialsChart.length > 15 ? 9 : 11, fontWeight: 700, fill: '#64748B' }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} unit="L" />
                <Tooltip content={<FinancialChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={dynamicFinancialsChart.length > 15 ? 7 : (dynamicFinancialsChart.length > 7 ? 14 : 24)} name="Income (Lakhs)" />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={dynamicFinancialsChart.length > 15 ? 7 : (dynamicFinancialsChart.length > 7 ? 14 : 24)} name="Expense (Lakhs)" />
              </BarChart>
            </ResponsiveContainer>
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
              <BarChart data={dynamicConversionClaimsChart}>
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
                  {dynamicConversionClaimsChart.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400 font-semibold">No lead conversion or claims settlement data available.</td>
                    </tr>
                  ) : (
                    dynamicConversionClaimsChart.map((row, idx) => (
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
              <BarChart data={dynamicStaffPerformanceChart}>
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
                  {dynamicStaffPerformanceChart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No staff advisor performance records available.</td>
                    </tr>
                  ) : (
                    dynamicStaffPerformanceChart.map((row, idx) => {
                      const pct = ((row.achieved / (row.target || 1)) * 100).toFixed(1);
                      return (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-slate-900">{row.fullName || row.name}</td>
                          <td className="p-3 text-slate-600 font-bold">{row.target} L</td>
                          <td className="p-3 font-bold text-amber-700">{row.achieved} L</td>
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
                  data={dynamicProductDistributionChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dynamicProductDistributionChart.map((entry, index) => (
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
                  {dynamicProductDistributionChart.map((row, idx) => (
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
    } else if (activeModal === 'POLICY_CATEGORY_OVERVIEW_MODAL') {
      title = "Policy Category & Insurer Cross-Matrix Intelligence Table";
      subtitle = `Live interactive matrix breakdown of ${policyCategoryOverview.totalPolicies} active policy contracts across ${policyCategoryOverview.chartData.length} insurance categories and ${policyCategoryOverview.companies.length} underwriter providers.`;

      // Filter and Sort Matrix Companies
      const filteredCompanies = policyCategoryOverview.companies.filter(comp => {
        if (matrixFilterCompany !== 'ALL' && comp !== matrixFilterCompany) return false;
        if (matrixSearchTerm.trim()) {
          const term = matrixSearchTerm.toLowerCase().trim();
          const nameMatch = comp.toLowerCase().includes(term);
          const hasMatchingCat = policyCategoryOverview.chartData.some(c => 
            c.category.toLowerCase().includes(term) && 
            ((policyCategoryOverview.companyBreakdown[comp] && policyCategoryOverview.companyBreakdown[comp][c.category]) || 0) > 0
          );
          return nameMatch || hasMatchingCat;
        }
        return true;
      }).sort((a, b) => {
        if (matrixSortOrder === 'ALPHA') return a.localeCompare(b);
        // Default DESC by total volume
        const totalA = policyCategoryOverview.chartData.reduce((sum, c) => sum + ((policyCategoryOverview.companyBreakdown[a] && policyCategoryOverview.companyBreakdown[a][c.category]) || 0), 0);
        const totalB = policyCategoryOverview.chartData.reduce((sum, c) => sum + ((policyCategoryOverview.companyBreakdown[b] && policyCategoryOverview.companyBreakdown[b][c.category]) || 0), 0);
        return totalB - totalA;
      });

      // Compute Column Totals
      const colTotals = {};
      policyCategoryOverview.chartData.forEach(c => {
        colTotals[c.category] = policyCategoryOverview.companies.reduce((sum, comp) => {
          return sum + ((policyCategoryOverview.companyBreakdown[comp] && policyCategoryOverview.companyBreakdown[comp][c.category]) || 0);
        }, 0);
      });

      content = (
        <div className="space-y-6">
          {/* TOP ANALYTICAL HIGHLIGHT KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-200 tracking-wider block">Total Active Policies</span>
              <p className="text-2xl font-black">{policyCategoryOverview.totalPolicies}</p>
              <span className="text-[10px] font-extrabold text-blue-100 block">Across All Categories</span>
            </div>

            <div className="bg-gradient-to-tr from-purple-600 to-indigo-800 p-4 rounded-2xl text-white shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-200 tracking-wider block">Partner Insurers</span>
              <p className="text-2xl font-black">{policyCategoryOverview.companies.length} Companies</p>
              <span className="text-[10px] font-extrabold text-purple-100 block">Underwriter Providers</span>
            </div>

            <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 p-4 rounded-2xl text-white shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-200 tracking-wider block">Product Lines</span>
              <p className="text-2xl font-black">{policyCategoryOverview.chartData.length} Lines</p>
              <span className="text-[10px] font-extrabold text-emerald-100 block">Active Insurance Lines</span>
            </div>

            <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-100 tracking-wider block flex items-center space-x-1">
                <span>Leading Underwriter</span>
                <Trophy className="h-3 w-3 text-amber-200" />
              </span>
              <p className="text-sm font-black truncate">{policyCategoryOverview.topCompany?.name || 'Star Health'}</p>
              <span className="text-[10px] font-extrabold text-amber-100 block">
                {policyCategoryOverview.topCompany?.count || 0} Policies Underwritten
              </span>
            </div>
          </div>

          {/* INTERACTIVE CONTROLS TOOLBAR */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search Insurer or Product Category..."
                value={matrixSearchTerm}
                onChange={(e) => setMatrixSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
              {matrixSearchTerm && (
                <button 
                  onClick={() => setMatrixSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto shrink-0">
              <select
                value={matrixFilterCompany}
                onChange={(e) => setMatrixFilterCompany(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-white text-slate-800 outline-none cursor-pointer shadow-xs"
              >
                <option value="ALL">All Insurers ({policyCategoryOverview.companies.length})</option>
                {policyCategoryOverview.companies.map((comp, i) => (
                  <option key={i} value={comp}>{comp}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setMatrixViewType('HEATMAP')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${matrixViewType === 'HEATMAP' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  title="Heatmap Density View"
                >
                  Heatmap 🎨
                </button>
                <button
                  onClick={() => setMatrixViewType('CLEAN')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${matrixViewType === 'CLEAN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  title="Standard Badge View"
                >
                  Standard 📊
                </button>
              </div>

              <select
                value={matrixSortOrder}
                onChange={(e) => setMatrixSortOrder(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 outline-none cursor-pointer shadow-xs"
              >
                <option value="DESC">Sort: High Volume ⬇</option>
                <option value="ALPHA">Sort: Alphabetical A-Z</option>
              </select>

              <button
                onClick={() => exportDashboardCategoryAndCompanyExcel(policyCategoryOverview, currentMetrics)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center space-x-1 shrink-0"
                title="Download Category & Company Analytics Spreadsheet"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* MATRIX TABLE GRID */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-card bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 shadow-sm min-w-[200px]">
                    Insurance Company / Underwriter
                  </th>
                  {policyCategoryOverview.chartData.map((c, i) => (
                    <th key={i} className="p-3.5 text-center border-r border-slate-800 whitespace-nowrap min-w-[130px]">
                      {c.category}
                    </th>
                  ))}
                  <th className="p-3.5 text-right whitespace-nowrap min-w-[130px]">
                    Total Underwritten
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={policyCategoryOverview.chartData.length + 2} className="p-8 text-center text-slate-400 font-bold">
                      No matching insurance companies found in matrix table.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((comp, idx) => {
                    let rowTotal = 0;
                    policyCategoryOverview.chartData.forEach(c => {
                      rowTotal += (policyCategoryOverview.companyBreakdown[comp] && policyCategoryOverview.companyBreakdown[comp][c.category]) || 0;
                    });
                    const rowPercentage = policyCategoryOverview.totalPolicies ? Math.round((rowTotal / policyCategoryOverview.totalPolicies) * 100) : 0;

                    return (
                      <tr key={idx} className="hover:bg-blue-50/50 transition group">
                        {/* Sticky Insurer Name Column */}
                        <td className="p-3.5 font-black text-slate-900 border-r border-slate-200/80 sticky left-0 bg-white group-hover:bg-blue-50/90 z-10 flex items-center justify-between shadow-xs">
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <span className="truncate font-extrabold">{comp}</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono ml-2">{rowPercentage}%</span>
                        </td>

                        {/* Category Columns Cells */}
                        {policyCategoryOverview.chartData.map((c, ci) => {
                          const count = (policyCategoryOverview.companyBreakdown[comp] && policyCategoryOverview.companyBreakdown[comp][c.category]) || 0;
                          const cellShare = rowTotal > 0 ? Math.round((count / rowTotal) * 100) : 0;

                          // Heatmap Color Badges
                          let badgeStyle = 'text-slate-300';
                          if (count > 0) {
                            if (matrixViewType === 'CLEAN') {
                              badgeStyle = 'badge badge-brand text-[11px] font-black shadow-2xs';
                            } else {
                              if (count >= 5) {
                                badgeStyle = 'bg-gradient-to-tr from-amber-500 to-emerald-600 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-md border border-amber-300';
                              } else if (count >= 3) {
                                badgeStyle = 'bg-indigo-100 text-indigo-900 font-black text-[11px] px-2.5 py-1 rounded-xl border border-indigo-300 shadow-2xs';
                              } else {
                                badgeStyle = 'bg-blue-50 text-blue-800 font-bold text-[11px] px-2.5 py-1 rounded-xl border border-blue-200';
                              }
                            }
                          }

                          return (
                            <td key={ci} className="p-3 text-center border-r border-slate-100 font-bold">
                              {count > 0 ? (
                                <span 
                                  className={`inline-flex items-center space-x-1 cursor-default ${badgeStyle}`}
                                  title={`${comp} has ${count} policies in ${c.category} (${cellShare}% of insurer's portfolio)`}
                                >
                                  <span>{count}</span>
                                  {count >= 5 && <Trophy className="h-3 w-3 text-amber-200 ml-0.5" />}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Total Column */}
                        <td className="p-3.5 text-right font-black border-l border-slate-200/80 bg-slate-50/40 group-hover:bg-blue-100/50 transition">
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-blue-700 font-black">{rowTotal} Policies</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${Math.min(100, rowPercentage * 2)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* FOOTER SUMMARY ROW */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs uppercase tracking-wider border-t-2 border-slate-800">
                  <td className="p-3.5 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                    Total Across All Insurers
                  </td>
                  {policyCategoryOverview.chartData.map((c, i) => {
                    const totalForCat = colTotals[c.category] || 0;
                    const catShare = policyCategoryOverview.totalPolicies ? Math.round((totalForCat / policyCategoryOverview.totalPolicies) * 100) : 0;
                    return (
                      <td key={i} className="p-3.5 text-center border-r border-slate-800">
                        <div className="flex flex-col items-center">
                          <span className="text-amber-300 font-black text-sm">{totalForCat}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{catShare}% Share</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                    {policyCategoryOverview.totalPolicies} Total
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* INSIGHTS FOOTER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200 gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600 font-bold">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Real-time Multi-Underwriter Market Matrix</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  navigate('/policies');
                }}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
              >
                <span>Go to Full Policies Register</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isMatrixModal = activeModal === 'POLICY_CATEGORY_OVERVIEW_MODAL';

    return (
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${isMatrixModal ? 'top-16 z-30' : 'z-50'}`}>
        <div className={`bg-white w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn ${
          isMatrixModal 
            ? 'max-w-[98vw] xl:max-w-7xl h-[calc(100vh-6rem)] flex flex-col my-auto' 
            : 'max-w-3xl my-8'
        }`}>
          {/* Modal Header */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between shrink-0">
            <div className="space-y-1 pr-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-black tracking-tight">{title}</h3>
              </div>
              {subtitle && <p className="text-xs text-slate-400 font-semibold">{subtitle}</p>}
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Close Matrix View"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className={`p-4 sm:p-6 overflow-y-auto ${isMatrixModal ? 'flex-1' : 'max-h-[70vh]'}`}>
            {content}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              {isMatrixModal ? '📊 Multi-Company Policy Matrix Intelligence Active' : 'Portfolio Analysis Overview'}
            </span>
            <button 
              onClick={() => setActiveModal(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer ml-auto"
            >
              Close Analysis Window
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleExportDashboardPDF = () => {
    exportDashboardAnalyticsPDF(
      dateFilter,
      currentMetrics,
      currentMetrics.productDistributionChart,
      currentMetrics.conversionClaimsChart,
      currentMetrics.staffPerformanceChart,
      policyCategoryOverview,
      {
        financialChart: dynamicFinancialsChart,
        renewalsList: (policies || []).filter(p => p.status === 'ACTIVE' || !p.status),
        specialDaysList: (customers || []).flatMap(c => {
          const events = [];
          if (c.dob) events.push({ customerName: c.name, type: 'Birthday 🎂', date: c.dob, phone: c.phone });
          if (c.anniversaryDate) events.push({ customerName: c.name, type: 'Anniversary 💍', date: c.anniversaryDate, phone: c.phone });
          return events;
        }),
        expensesList: expenses,
        totalExpenses: companyOperatingExpenses.totalAmount,
        dateFilter
      }
    );
  };

  const handleExportDashboardExcel = () => {
    exportDashboardCategoryAndCompanyExcel(
      policyCategoryOverview,
      currentMetrics,
      {
        staffData: currentMetrics.staffPerformanceChart,
        financialChart: dynamicFinancialsChart,
        renewalsList: (policies || []).filter(p => p.status === 'ACTIVE' || !p.status),
        expensesList: expenses,
        specialDaysList: (customers || []).flatMap(c => {
          const events = [];
          if (c.dob) events.push({ customerName: c.name, type: 'Birthday', date: c.dob, phone: c.phone });
          if (c.anniversaryDate) events.push({ customerName: c.name, type: 'Anniversary', date: c.anniversaryDate, phone: c.phone });
          return events;
        }),
        totalExpenses: companyOperatingExpenses.totalAmount,
        dateFilter
      }
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
              Welcome, {user?.name || 'Admin'}!
            </h1>
            <p className="text-xs text-blue-100 font-medium">Real-time Performance, Portfolio &amp; Financial Overview</p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-2">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <>
                <button 
                  onClick={handleExportDashboardPDF} 
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  title="Download All Dashboard Data as Master PDF Report"
                >
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </button>
                <button 
                  onClick={handleExportDashboardExcel} 
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs shadow-md border border-white/20 transition cursor-pointer"
                  title="Download All Dashboard Data as Master Excel / CSV Spreadsheet"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Excel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-3">
        {/* Direct Standard Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs shrink-0 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            <span>Date:</span>
          </div>
          <input 
            type="date" 
            value={customStartDate} 
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              setDateFilter('CUSTOM');
            }}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] ${
              dateFilter === 'CUSTOM' ? 'border-blue-500 ring-1 ring-blue-500 font-bold' : 'border-slate-300'
            }`}
            placeholder="dd-mm-yyyy"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="date" 
            value={customEndDate} 
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              setDateFilter('CUSTOM');
            }}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] ${
              dateFilter === 'CUSTOM' ? 'border-blue-500 ring-1 ring-blue-500 font-bold' : 'border-slate-300'
            }`}
            placeholder="dd-mm-yyyy"
          />
          <button
            type="button"
            onClick={() => {
              let start = customStartDate;
              let end = customEndDate;
              if (!start && !end) {
                const today = new Date().toISOString().split('T')[0];
                start = today;
                end = today;
                setCustomStartDate(today);
                setCustomEndDate(today);
              } else if (start && !end) {
                end = start;
                setCustomEndDate(start);
              } else if (!start && end) {
                start = end;
                setCustomStartDate(end);
              }
              setDateFilter('CUSTOM');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center shadow-xs min-h-[34px] ${
              dateFilter === 'CUSTOM'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Filter
          </button>
        </div>

        {/* Quick Range Presets: Today | Weekly | Monthly | Last Month | Semi-Annual | Annual */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Today */}
          <button 
            type="button"
            onClick={() => {
              const todayStr = toDateKey(new Date());
              setCustomStartDate(todayStr);
              setCustomEndDate(todayStr);
              setDateFilter('TODAY');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'TODAY'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Today
          </button>

          {/* Weekly */}
          <button 
            type="button"
            onClick={() => {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
              const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
              setCustomStartDate(toDateKey(mon));
              setCustomEndDate(toDateKey(sun));
              setDateFilter('THIS_WEEK');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'THIS_WEEK'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Weekly
          </button>

          {/* Monthly */}
          <button 
            type="button"
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const end = new Date(now.getFullYear(), now.getMonth(), lastDay);
              setCustomStartDate(toDateKey(start));
              setCustomEndDate(toDateKey(end));
              setDateFilter('THIS_MONTH');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'THIS_MONTH'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Monthly
          </button>

          {/* Last Month */}
          <button 
            type="button"
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
              const end = new Date(start.getFullYear(), start.getMonth(), lastDay);
              setCustomStartDate(toDateKey(start));
              setCustomEndDate(toDateKey(end));
              setDateFilter('LAST_MONTH');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'LAST_MONTH'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Last Month
          </button>

          {/* Semi-Annual */}
          <button 
            type="button"
            onClick={() => {
              const now = new Date();
              const isH1 = now.getMonth() < 6;
              const start = new Date(now.getFullYear(), isH1 ? 0 : 6, 1);
              const end = new Date(now.getFullYear(), isH1 ? 5 : 11, isH1 ? 30 : 31);
              setCustomStartDate(toDateKey(start));
              setCustomEndDate(toDateKey(end));
              setDateFilter('SEMI_ANNUAL');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'SEMI_ANNUAL'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Semi-Annual
          </button>

          {/* Annual */}
          <button 
            type="button"
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), 0, 1);
              const end = new Date(now.getFullYear(), 11, 31);
              setCustomStartDate(toDateKey(start));
              setCustomEndDate(toDateKey(end));
              setDateFilter('THIS_YEAR');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer min-h-[34px] flex items-center justify-center ${
              dateFilter === 'THIS_YEAR'
                ? 'bg-slate-900 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
            }`}
          >
            Annual
          </button>
        </div>
      </div>





      {/* KPI Overview Cards - Interactive Clickable Grid (4 Key Cards) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <div 
          onClick={() => {
            if (isStaffAdvisor) {
              navigate('/customers');
            } else {
              setActiveModal('TOTAL_CUSTOMERS');
            }
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-blue-500 hover:shadow-lg transition cursor-pointer group relative"
          title={isStaffAdvisor ? 'Click to view your assigned customer portfolios' : 'Click to view detailed customer breakdown & analysis'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-blue-600 transition">
              {isStaffAdvisor ? 'My Assigned Customers' : 'Total Customers'}
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
          <p className="text-2xl font-black text-slate-900">{currentMetrics.activePolicies.toLocaleString()}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="badge badge-purple text-[10px]">{currentMetrics.activePolicies} Active Folios</span>
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

        {/* Company Expenditure (Admin Only) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <div 
            onClick={() => setActiveModal('COMPANY_EXPENDITURE')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-amber-500 hover:shadow-lg transition cursor-pointer group relative"
            title="Click to view detailed company operating expenditure breakdown"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-amber-600 transition">Company Expenditure</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition"><Building2 className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-black text-slate-900">
              ₹{Number(companyOperatingExpenses.totalAmount || 0).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="badge bg-amber-100 text-amber-800 text-[10px]">
                {companyOperatingExpenses.items.length} {companyOperatingExpenses.items.length === 1 ? 'Recorded Entry' : 'Recorded Entries'}
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 hover:underline flex items-center space-x-0.5">
                <span>View Details</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        )}
      </div>



      {/* DASHBOARD STAFF PERFORMANCE LEADERBOARD (MANAGERS & ADMINS ONLY) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'BRANCH_MANAGER') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Employee Performance</span>
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-amber text-[10px] uppercase font-black">Business Value</span>
              <span className="badge badge-purple text-[10px] uppercase font-black">Total Leads</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 whitespace-nowrap">Rank</th>
                  <th className="p-3 whitespace-nowrap">Staff Advisor</th>
                  <th className="p-3 whitespace-nowrap">Policies / SIPs</th>
                  <th className="p-3 whitespace-nowrap">Total Business Value</th>
                  <th className="p-3 whitespace-nowrap">Active Assigned</th>
                  <th className="p-3 whitespace-nowrap">Completed Clients</th>
                  <th className="p-3 whitespace-nowrap">Total Clients</th>
                  <th className="p-3 whitespace-nowrap">Portfolio Share</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedStaffPerformance.map((st, idx) => {
                  const totalCusts = customers.length || 1;
                  const pct = ((st.totalCount / totalCusts) * 100).toFixed(1);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-black whitespace-nowrap">
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-1.5 whitespace-nowrap">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{st.name}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-700 whitespace-nowrap">{st.policyCount} Contracts</td>
                      <td className="p-3 font-black text-emerald-700 whitespace-nowrap">₹{st.businessAmount.toLocaleString()}</td>
                      <td className="p-3 font-bold text-indigo-700 whitespace-nowrap">{st.activeCount} Active</td>
                      <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">{st.completedCount} Completed</td>
                      <td className="p-3 font-black text-slate-900 whitespace-nowrap">{st.totalCount} Total</td>
                      <td className="p-3 font-black text-slate-800 whitespace-nowrap">{pct}% Share</td>
                      <td className="p-3 whitespace-nowrap">
                        {idx === 0 && st.businessAmount > 0 ? (
                          <span className="badge badge-green text-[10px]">Top Business Leader 🏆</span>
                        ) : st.activeCount > 0 ? (
                          <span className="badge badge-purple text-[10px]">Active Workload ⚡</span>
                        ) : (
                          <span className="badge badge-brand text-[10px]">Active Business</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN-ONLY: POLICY CATEGORY OVERVIEW VISUALIZATION */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-card space-y-6">
          {/* Header with Title, Standalone Tab Switcher (By Category / By Company), Filter, and Matrix button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Policy Category &amp; Company Overview
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              {/* Standalone View Switcher: By Category | By Company (Dual View removed) */}
              <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPolicyOverviewViewMode('CATEGORY')}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                    policyOverviewViewMode === 'CATEGORY' 
                      ? 'bg-blue-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>By Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyOverviewViewMode('COMPANY')}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                    policyOverviewViewMode === 'COMPANY' 
                      ? 'bg-purple-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>By Company</span>
                </button>
              </div>

              {/* Dynamic Interactive Filter Dropdown depending on active tab */}
              {policyOverviewViewMode === 'CATEGORY' ? (
                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <select
                    value={selectedOverviewCategoryFilter}
                    onChange={(e) => setSelectedOverviewCategoryFilter(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 outline-none cursor-pointer pr-1"
                    title="Select specific category to view provider company breakdown"
                  >
                    <option value="ALL">All Categories ({policyCategoryOverview.categories.length})</option>
                    {policyCategoryOverview.categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <select
                    value={selectedCategoryCompanyFilter}
                    onChange={(e) => setSelectedCategoryCompanyFilter(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 outline-none cursor-pointer pr-1"
                    title="Select specific company to view category breakdown"
                  >
                    <option value="ALL">All Companies ({policyCategoryOverview.companies.length})</option>
                    {policyCategoryOverview.companies.map((comp, idx) => (
                      <option key={idx} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Matrix Table Modal Trigger */}
              <button
                type="button"
                onClick={() => setActiveModal('POLICY_CATEGORY_OVERVIEW_MODAL')}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md shadow-blue-500/20 shrink-0"
                title="View complete cross-company policy matrix table"
              >
                <BarChart3 className="h-4 w-4 text-blue-200" />
                <span>📊 Matrix Table View</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-1 hover:bg-slate-50 transition">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Policies</span>
              <p className="text-2xl font-black text-slate-900">{policyCategoryOverview.totalPolicies}</p>
              <div className="flex items-center space-x-1 pt-0.5">
                <span className="badge badge-brand text-[10px]">Pure Insurance Policies</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-1 hover:bg-slate-50 transition">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Categories</span>
              <p className="text-2xl font-black text-indigo-700">{policyCategoryOverview.categories.length}</p>
              <div className="flex items-center space-x-1 pt-0.5">
                <span className="badge badge-purple text-[10px]">Distinct Insurance Lines</span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-1 hover:bg-slate-50 transition">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leading Category</span>
              <p className="text-base font-black text-emerald-700 truncate">{policyCategoryOverview.topCategory?.category || 'None'}</p>
              <div className="flex items-center space-x-1 pt-0.5">
                <span className="badge badge-green text-[10px]">
                  {policyCategoryOverview.topCategory?.policyCount || 0} Policies ({policyCategoryOverview.totalPolicies ? Math.round(((policyCategoryOverview.topCategory?.policyCount || 0) / policyCategoryOverview.totalPolicies) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-1 hover:bg-slate-50 transition">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Top Partner Insurer</span>
              <p className="text-base font-black text-purple-700 truncate">{policyCategoryOverview.topCompany?.name || 'None'}</p>
              <div className="flex items-center space-x-1 pt-0.5">
                <span className="badge bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                  {policyCategoryOverview.topCompany?.count || 0} Contracts Underwritten
                </span>
              </div>
            </div>
          </div>

          {/* STANDALONE VIEW 1: BY CATEGORY */}
          {policyOverviewViewMode === 'CATEGORY' && (
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {selectedOverviewCategoryFilter === 'ALL'
                        ? 'All Insurance Categories Distribution'
                        : `${selectedOverviewCategoryFilter} – Underwriter Provider Distribution`}
                    </h4>
                  </div>
                </div>

                {selectedOverviewCategoryFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedOverviewCategoryFilter('ALL')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer self-start sm:self-auto flex items-center space-x-1"
                  >
                    <span>✕ Show All Categories</span>
                  </button>
                )}
              </div>

              {/* Chart: When ALL categories selected */}
              {selectedOverviewCategoryFilter === 'ALL' ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={policyCategoryOverview.chartData}
                      margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="category" 
                        tickLine={false} 
                        axisLine={false} 
                        interval={0}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const companyKeys = Object.entries(data.companies || {});
                            const sharePct = policyCategoryOverview.totalPolicies 
                              ? Math.round((data.policyCount / policyCategoryOverview.totalPolicies) * 100) 
                              : 0;

                            return (
                              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-2 text-xs font-semibold max-w-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                  <p className="font-black text-slate-900 text-sm">{data.category}</p>
                                  <span className="badge badge-brand text-[10px]">{sharePct}% Share</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="flex justify-between items-center text-slate-600">
                                    <span>Total Policies:</span>
                                    <span className="font-black text-blue-700">{data.policyCount} Policies</span>
                                  </p>
                                  <p className="flex justify-between items-center text-slate-600">
                                    <span>Gross Premium Value:</span>
                                    <span className="font-black text-emerald-700">₹{(data.totalPremium || 0).toLocaleString()}</span>
                                  </p>
                                </div>
                                {companyKeys.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">Company Providers:</p>
                                    <div className="space-y-0.5">
                                      {companyKeys.slice(0, 5).map(([comp, count], i) => (
                                        <p key={i} className="flex justify-between items-center text-[11px]">
                                          <span className="text-slate-600 truncate max-w-[150px]">{comp}:</span>
                                          <span className="font-bold text-slate-900">{count}</span>
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar 
                        dataKey="policyCount" 
                        name="Underwritten Policies" 
                        fill="#2563EB" 
                        radius={[8, 8, 0, 0]} 
                        barSize={36}
                      >
                        {policyCategoryOverview.chartData.map((entry, index) => {
                          const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#0D9488', '#F43F5E'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Chart: When an INDIVIDUAL Category is selected -> Show Company Breakdown */
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={policyCategoryOverview.categoryDrilldownData}
                      margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="shortName" 
                        tickLine={false} 
                        axisLine={false} 
                        interval={0}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-1.5 text-xs font-semibold max-w-xs">
                                <div className="border-b border-slate-100 pb-1">
                                  <p className="font-black text-slate-900 text-sm">{data.company}</p>
                                  <p className="text-[11px] text-blue-600 font-bold">{data.category}</p>
                                </div>
                                <p className="flex justify-between items-center text-slate-600 pt-1">
                                  <span>Policies Underwritten:</span>
                                  <span className="font-black text-blue-700">{data.policyCount} Policies</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar 
                        dataKey="policyCount" 
                        name={`Policies in ${selectedOverviewCategoryFilter}`} 
                        fill="#2563EB" 
                        radius={[8, 8, 0, 0]} 
                        barSize={36}
                      >
                        {policyCategoryOverview.categoryDrilldownData.map((entry, index) => {
                          const colors = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#0D9488', '#F43F5E'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Interactive Category Chips Strip (Clickable to switch drilldown) */}
              <div className="pt-3 border-t border-slate-200/60">
                <span className="text-[11px] font-black uppercase text-slate-400 block mb-2">Click Category to Inspect Providers:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOverviewCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      selectedOverviewCategoryFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Categories ({policyCategoryOverview.totalPolicies})
                  </button>
                  {policyCategoryOverview.chartData.map((item, idx) => {
                    const isSelected = selectedOverviewCategoryFilter === item.category;
                    const colors = [
                      'border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100', 
                      'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100', 
                      'border-purple-200 bg-purple-50/70 text-purple-800 hover:bg-purple-100', 
                      'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100', 
                      'border-teal-200 bg-teal-50/70 text-teal-800 hover:bg-teal-100'
                    ];
                    const colorClass = colors[idx % colors.length];

                    return (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => setSelectedOverviewCategoryFilter(item.category)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                          isSelected ? 'ring-2 ring-blue-600 bg-blue-600 text-white border-blue-600 shadow-sm' : colorClass
                        }`}
                      >
                        <span>{item.category}:</span>
                        <span className="font-black">{item.policyCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STANDALONE VIEW 2: BY COMPANY */}
          {policyOverviewViewMode === 'COMPANY' && (
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {selectedCategoryCompanyFilter === 'ALL'
                        ? 'Insurance Companies Overview'
                        : `${selectedCategoryCompanyFilter} – Category Portfolio Breakdown`}
                    </h4>
                    {selectedCategoryCompanyFilter !== 'ALL' && (
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Active policy distribution across insurance categories for {selectedCategoryCompanyFilter}
                      </p>
                    )}
                  </div>
                </div>

                {selectedCategoryCompanyFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryCompanyFilter('ALL')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition cursor-pointer self-start sm:self-auto flex items-center space-x-1"
                  >
                    <span>✕ Show All Companies</span>
                  </button>
                )}
              </div>

              {/* Chart: When ALL companies selected */}
              {selectedCategoryCompanyFilter === 'ALL' ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={policyCategoryOverview.companyChartData}
                      margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="shortName" 
                        tickLine={false} 
                        axisLine={false} 
                        interval={0}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const catEntries = Object.entries(data.categoryBreakdown || {});
                            const sharePct = policyCategoryOverview.totalPolicies 
                              ? Math.round((data.policyCount / policyCategoryOverview.totalPolicies) * 100) 
                              : 0;

                            return (
                              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-2 text-xs font-semibold max-w-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                  <p className="font-black text-slate-900 text-sm">{data.company}</p>
                                  <span className="badge badge-purple text-[10px]">{sharePct}% Share</span>
                                </div>
                                <p className="flex justify-between items-center text-slate-600">
                                  <span>Total Policies:</span>
                                  <span className="font-black text-purple-700">{data.policyCount} Policies</span>
                                </p>
                                {catEntries.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">Category Breakdown:</p>
                                    <div className="space-y-0.5">
                                      {catEntries.map(([cat, count], i) => (
                                        <p key={i} className="flex justify-between items-center text-[11px]">
                                          <span className="text-slate-600">{cat}:</span>
                                          <span className="font-bold text-slate-900">{count}</span>
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar 
                        dataKey="policyCount" 
                        name="Underwritten Policies" 
                        fill="#8B5CF6" 
                        radius={[8, 8, 0, 0]} 
                        barSize={36}
                      >
                        {policyCategoryOverview.companyChartData.map((entry, index) => {
                          const colors = ['#8B5CF6', '#2563EB', '#10B981', '#F59E0B', '#0D9488', '#F43F5E'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Chart: When an INDIVIDUAL Company is selected -> Show Category Breakdown */
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={policyCategoryOverview.companyDrilldownData}
                      margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="category" 
                        tickLine={false} 
                        axisLine={false} 
                        interval={0}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-1.5 text-xs font-semibold max-w-xs">
                                <div className="border-b border-slate-100 pb-1">
                                  <p className="font-black text-slate-900 text-sm">{data.company}</p>
                                  <p className="text-[11px] text-purple-600 font-bold">{data.category}</p>
                                </div>
                                <p className="flex justify-between items-center text-slate-600 pt-1">
                                  <span>Underwritten Policies:</span>
                                  <span className="font-black text-purple-700">{data.policyCount} Policies</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar 
                        dataKey="policyCount" 
                        name={`Policies in ${selectedCategoryCompanyFilter}`} 
                        fill="#8B5CF6" 
                        radius={[8, 8, 0, 0]} 
                        barSize={36}
                      >
                        {policyCategoryOverview.companyDrilldownData.map((entry, index) => {
                          const colors = ['#8B5CF6', '#2563EB', '#10B981', '#F59E0B', '#0D9488', '#F43F5E'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Interactive Company Chips Strip (Clickable to switch drilldown) */}
              <div className="pt-3 border-t border-slate-200/60">
                <span className="text-[11px] font-black uppercase text-slate-400 block mb-2">Click Company to Inspect Categories:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryCompanyFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      selectedCategoryCompanyFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Companies ({policyCategoryOverview.companies.length})
                  </button>
                  {policyCategoryOverview.companyChartData.map((item, idx) => {
                    const isSelected = selectedCategoryCompanyFilter === item.company;
                    const colors = [
                      'border-purple-200 bg-purple-50/70 text-purple-800 hover:bg-purple-100', 
                      'border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100', 
                      'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100', 
                      'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100', 
                      'border-teal-200 bg-teal-50/70 text-teal-800 hover:bg-teal-100'
                    ];
                    const colorClass = colors[idx % colors.length];

                    return (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => setSelectedCategoryCompanyFilter(item.company)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                          isSelected ? 'ring-2 ring-purple-600 bg-purple-600 text-white border-purple-600 shadow-sm' : colorClass
                        }`}
                      >
                        <span>{item.shortName}:</span>
                        <span className="font-black">{item.policyCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXECUTIVE BUSINESS ANALYTICS: INCOME VS EXPENSE (Admins & Managers only) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="grid grid-cols-1 gap-6">
          {/* Income vs Expense Variance */}
          <div 
            onClick={() => setActiveModal('INCOME_EXPENSE_CHART')}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
            title="Click to view complete income vs expense variance breakdown"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition flex items-center space-x-1.5">
                  <span>Income vs Expense</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
                </h3>
              </div>
            </div>

            <div className="h-[340px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={dynamicFinancialsChart}
                  margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                  barGap={6}
                  barCategoryGap="40%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                    angle={0}
                    textAnchor="middle"
                    height={25}
                    tick={{ fontSize: dynamicFinancialsChart.length > 15 ? 9 : 11, fontWeight: 700, fill: '#64748B' }} 
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} unit="L" />
                  <Tooltip content={<FinancialChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={dynamicFinancialsChart.length > 15 ? 7 : (dynamicFinancialsChart.length > 7 ? 14 : 24)} name="Income (Lakhs)" />
                  <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={dynamicFinancialsChart.length > 15 ? 7 : (dynamicFinancialsChart.length > 7 ? 14 : 24)} name="Expense (Lakhs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
