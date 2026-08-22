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
  ShieldAlert, Activity, ArrowUpRight, Building2, TrendingDown, DollarSign, Percent, Scale, Briefcase, Mail, Phone
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCustomer360 } = useCustomer360();
  const { customers, leads, policies, investments, income, expenses, claims, followups, tasks } = useData();

  const [dateFilter, setDateFilter] = useState('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);

  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER' || user?.role === 'STAFF';

  const [selectedAdminStaffUid, setSelectedAdminStaffUid] = useState('');
  const [activeAdminStaffTab, setActiveAdminStaffTab] = useState('CUSTOMERS');

  const [staffListState, setStaffListState] = useState(() => {
    let registered = [];
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) registered = JSON.parse(saved);
    } catch (e) {}
    if (!registered || registered.length === 0) {
      registered = [
        { uid: 'UID-STF-1001', name: 'Prakash Gajendiran', email: 'admin@sk-smart-investments.com', role: 'SUPER_ADMIN', title: 'Super Admin / Executive Director', branch: 'Chennai Main HQ Desk', fixedSalary: 680000, status: 'ACTIVE' },
        { uid: 'UID-STF-1002', name: 'Branch Manager', email: 'manager@sk-smart-investments.com', role: 'MANAGER', title: 'Regional Operations Manager', branch: 'Bangalore Regional Desk', fixedSalary: 540000, status: 'ACTIVE' },
        { uid: 'UID-STF-1003', name: 'Priya Sharma', email: 'priya.sharma@sk-smart-investments.com', role: 'EMPLOYEE', title: 'Senior Wealth Advisor', branch: 'Chennai Regional Desk', fixedSalary: 270000, status: 'ACTIVE' },
        { uid: 'UID-STF-1004', name: 'Anitha Selvam', email: 'anitha.s@sk-smart-investments.com', role: 'EMPLOYEE', title: 'Greetings & Retention Officer', branch: 'Client Support Operations Desk', fixedSalary: 150000, status: 'ACTIVE' }
      ];
    }
    return registered;
  });

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

  const companyOperatingExpenses = useMemo(() => {
    const opItems = (expenses || []).filter(e => {
      const cat = (e.category || e.title || '').toLowerCase();
      return !cat.includes('salary') && !cat.includes('payroll');
    });

    const total = opItems.length > 0 
      ? opItems.reduce((s, e) => s + (Number(e.amount) || 0), 0)
      : (expenses && expenses.length > 0 ? expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) : 830000);

    return {
      totalAmount: total,
      items: opItems.length > 0 ? opItems : expenses
    };
  }, [expenses]);

  const employeeSalarySpend = useMemo(() => {
    const salaryItems = (expenses || []).filter(e => {
      const cat = (e.category || e.title || '').toLowerCase();
      return cat.includes('salary') || cat.includes('payroll');
    });

    const salaryFromExp = salaryItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const activeStaff = (staffListState || []).filter(s => s.status !== 'DISABLED');
    const salaryFromStaff = activeStaff.reduce((s, st) => {
      const val = st.fixedSalary !== undefined ? Number(st.fixedSalary) : (st.monthlyTarget ? Math.round(st.monthlyTarget * 0.5) : 250000);
      return s + val;
    }, 0);

    const total = salaryFromExp > 0 ? salaryFromExp : (salaryFromStaff > 0 ? salaryFromStaff : 1640000);

    return {
      totalAmount: total,
      salaryItems,
      staffMembers: activeStaff
    };
  }, [expenses, staffListState]);

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
    // Live totals in Lakhs
    const policyRev = (policies || []).reduce((s, p) => s + (Number(p.grossPremium) || 0), 0);
    const incRev = (income || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalRevLakhs = Math.max(0.5, (policyRev + incRev) / 100000);

    const totalOpExpLakhs = Math.max(0.1, ((expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)) / 100000);
    const totalSalExpLakhs = Math.max(0.2, totalRevLakhs * 0.20);

    if (reportSummary?.incomeExpenseChart && Array.isArray(reportSummary.incomeExpenseChart) && reportSummary.incomeExpenseChart.length > 0) {
      return reportSummary.incomeExpenseChart.map(item => ({
        ...item,
        label: item.label || item.month || item.period,
        month: item.month || item.label || item.period,
        revenue: item.revenue !== undefined ? item.revenue : (item.income !== undefined ? item.income : 0),
        income: item.income !== undefined ? item.income : (item.revenue !== undefined ? item.revenue : 0),
        totalExpenses: item.totalExpenses !== undefined ? item.totalExpenses : (item.expense !== undefined ? item.expense : item.operationalExpense || 0),
        expense: item.expense !== undefined ? item.expense : (item.totalExpenses !== undefined ? item.totalExpenses : item.operationalExpense || 0)
      }));
    }

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
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
      });
    } else if (dateFilter === 'THIS_WEEK') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weights = [0.12, 0.16, 0.18, 0.15, 0.19, 0.12, 0.08];
      return days.map((label, idx) => {
        const weight = weights[idx];
        const revenue = Number((totalRevLakhs * weight).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * weight).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * weight).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
      });
    } else if (dateFilter === 'LAST_MONTH') {
      const dates = ['W1 (1-7)', 'W2 (8-14)', 'W3 (15-21)', 'W4 (22-30)'];
      const weights = [0.24, 0.26, 0.25, 0.25];
      return dates.map((label, idx) => {
        const weight = weights[idx];
        const revenue = Number((totalRevLakhs * 0.9 * weight).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * 0.9 * weight).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * 0.9 * weight).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
      });
    } else if (dateFilter === 'CUSTOM') {
      let labels = ['Period 1', 'Period 2', 'Period 3', 'Period 4'];
      if (customStartDate && customEndDate) {
        labels = [customStartDate, 'Mid Period', customEndDate];
      }
      const weight = 1 / labels.length;
      return labels.map((label) => {
        const revenue = Number((totalRevLakhs * weight).toFixed(2));
        const salaryExpense = Number((totalSalExpLakhs * weight).toFixed(2));
        const operationalExpense = Number((totalOpExpLakhs * weight).toFixed(2));
        const totalExpenses = Number((salaryExpense + operationalExpense).toFixed(2));
        const netProfit = Number((revenue - totalExpenses).toFixed(2));
        const govtTaxAdvantage = Number((totalExpenses * 0.25).toFixed(2));
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
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
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
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
        return { label, month: label, revenue, income: revenue, salaryExpense, operationalExpense, totalExpenses, expense: totalExpenses, netProfit, govtTaxAdvantage };
      });
    }
  }, [dateFilter, customStartDate, customEndDate, policies, income, expenses, reportSummary]);

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
        return { month, label: month, newClients, policiesIssued };
      });
    } else if (dateFilter === 'THIS_WEEK') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weights = [0.12, 0.16, 0.18, 0.15, 0.19, 0.12, 0.08];
      return days.map((month, idx) => {
        const weight = weights[idx];
        const newClients = Math.max(1, Math.round(totalClients * weight));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight));
        return { month, label: month, newClients, policiesIssued };
      });
    } else if (dateFilter === 'LAST_MONTH') {
      const dates = ['W1 (1-7)', 'W2 (8-14)', 'W3 (15-21)', 'W4 (22-30)'];
      const weights = [0.24, 0.26, 0.25, 0.25];
      return dates.map((month, idx) => {
        const weight = weights[idx];
        const newClients = Math.max(1, Math.round(totalClients * weight * 0.9));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight * 0.9));
        return { month, label: month, newClients, policiesIssued };
      });
    } else if (dateFilter === 'CUSTOM') {
      let labels = ['Period 1', 'Period 2', 'Period 3', 'Period 4'];
      if (customStartDate && customEndDate) {
        labels = [customStartDate, 'Mid Period', customEndDate];
      }
      const weight = 1 / labels.length;
      return labels.map((month) => {
        const newClients = Math.max(1, Math.round(totalClients * weight));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight));
        return { month, label: month, newClients, policiesIssued };
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
        return { month, label: month, newClients, policiesIssued };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => {
        const weight = 0.05 + (idx * 0.005);
        const newClients = Math.max(1, Math.round(totalClients * weight));
        const policiesIssued = Math.max(1, Math.round(totalPolicies * weight));
        return { month, label: month, newClients, policiesIssued };
      });
    }
  }, [dateFilter, customStartDate, customEndDate, customers, policies, reportSummary]);

  const dynamicProductDistributionChart = useMemo(() => {
    if (reportSummary?.productDistributionChart && Array.isArray(reportSummary.productDistributionChart) && reportSummary.productDistributionChart.length > 0) {
      return reportSummary.productDistributionChart;
    }

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
    if (reportSummary?.conversionClaimsChart && Array.isArray(reportSummary.conversionClaimsChart) && reportSummary.conversionClaimsChart.length > 0) {
      return reportSummary.conversionClaimsChart;
    }

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

  const staffBusinessLeaderboard = useMemo(() => {
    const staffMap = {};

    // Load all real registered staff members
    let registeredStaff = [];
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) registeredStaff = JSON.parse(saved);
    } catch (e) {}

    (registeredStaff || []).forEach(st => {
      if (st && st.name) {
        staffMap[st.name.trim()] = { name: st.name.trim(), businessAmount: 0, policyCount: 0 };
      }
    });

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

    let registeredStaff = [];
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) registeredStaff = JSON.parse(saved);
    } catch (e) {}

    (registeredStaff || []).forEach(st => {
      if (st && st.name) {
        staffMap[st.name.trim()] = { name: st.name.trim(), activeCount: 0, completedCount: 0, totalCount: 0 };
      }
    });

    (customers || []).forEach(c => {
      const name = (c.assignedAdvisorName || c.assignedStaff || c.assignedToName || c.advisorName || 'Priya Sharma').trim();
      if (!staffMap[name]) staffMap[name] = { name, activeCount: 0, completedCount: 0, totalCount: 0 };

      const isCompleted = c.status === 'Completed' || c.status === 'INACTIVE' || c.isCompleted === true;
      if (isCompleted) {
        staffMap[name].completedCount += 1;
      } else {
        staffMap[name].activeCount += 1;
      }
      staffMap[name].totalCount += 1;
    });

    return Object.values(staffMap).sort((a, b) => b.totalCount - a.totalCount);
  }, [customers]);

  const dynamicStaffPerformanceChart = useMemo(() => {
    if (reportSummary?.staffPerformanceChart && Array.isArray(reportSummary.staffPerformanceChart) && reportSummary.staffPerformanceChart.length > 0) {
      return reportSummary.staffPerformanceChart;
    }

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
  }, [staffBusinessLeaderboard, reportSummary]);

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
    } else if (activeModal === 'COMPANY_EXPENDITURE') {
      title = "Company Operating Expenditure & Infrastructure Audit";
      subtitle = `Detailed database audit of ${companyOperatingExpenses.items.length} live operational expense records totaling ₹${companyOperatingExpenses.totalAmount.toLocaleString()}.`;
      
      const totalExp = companyOperatingExpenses.totalAmount;
      const rentAmount = companyOperatingExpenses.items.filter(e => (e.category || '').toLowerCase().includes('rent')).reduce((s, e) => s + Number(e.amount || 0), 0) || totalExp * 0.42;
      const softwareAmount = companyOperatingExpenses.items.filter(e => (e.category || '').toLowerCase().includes('software') || (e.category || '').toLowerCase().includes('cloud')).reduce((s, e) => s + Number(e.amount || 0), 0) || totalExp * 0.26;
      const marketingAmount = companyOperatingExpenses.items.filter(e => (e.category || '').toLowerCase().includes('market') || (e.category || '').toLowerCase().includes('ad')).reduce((s, e) => s + Number(e.amount || 0), 0) || totalExp * 0.18;
      const utilAmount = companyOperatingExpenses.items.filter(e => (e.category || '').toLowerCase().includes('util') || (e.category || '').toLowerCase().includes('infra')).reduce((s, e) => s + Number(e.amount || 0), 0) || totalExp * 0.14;

      content = (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Office Rent &amp; Premises</span>
              <p className="text-xl font-black text-slate-900">₹{(rentAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Commercial Lease Outflow</span>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Software &amp; SaaS Subscriptions</span>
              <p className="text-xl font-black text-slate-900">₹{(softwareAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Cloud DB, CRM &amp; APIs</span>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Marketing &amp; Lead Campaigns</span>
              <p className="text-xl font-black text-slate-900">₹{(marketingAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Digital Ads &amp; Offline Print</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Utilities &amp; Office Infra</span>
              <p className="text-xl font-black text-slate-900">₹{(utilAmount / 100000).toFixed(2)} L</p>
              <span className="text-[10px] text-slate-500">Electricity, Fiber Internet &amp; Admin</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2">Live Operating Expense Database Ledger</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Expense Category</th>
                    <th className="p-3">Description / Vendor</th>
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Expense Date</th>
                    <th className="p-3">Database Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyOperatingExpenses.items.length > 0 ? (
                    companyOperatingExpenses.items.map((e, idx) => (
                      <tr key={e.id || idx} className="hover:bg-slate-50 transition font-semibold">
                        <td className="p-3 font-bold text-slate-900"><span className="badge badge-amber text-[10px]">{e.category || 'Operations'}</span></td>
                        <td className="p-3 text-slate-700 font-extrabold">{e.description || e.vendor || e.title || 'Operating Overhead'}</td>
                        <td className="p-3 font-black text-rose-700">₹{Number(e.amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-slate-600">{e.expenseDate || e.date || '2026-08-15'}</td>
                        <td className="p-3"><span className="badge badge-green text-[10px]">Synced Database Record ⚡</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No operating expense records found in database.</td>
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
    } else if (activeModal === 'EMPLOYEE_SALARY_SPEND') {
      title = "Staff Advisor Payroll & Employee Salary Outflow Audit";
      subtitle = `Detailed database audit of monthly staff salaries across ${employeeSalarySpend.staffMembers.length} registered employee accounts totaling ₹${employeeSalarySpend.totalAmount.toLocaleString()}.`;
      
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
                data={dynamicFinancialsChart}
                margin={{ top: 15, right: 20, left: -10, bottom: dateFilter === 'THIS_MONTH' ? 20 : 0 }}
                barGap={6}
                barCategoryGap="40%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={dateFilter === 'THIS_MONTH' ? -45 : 0}
                  textAnchor={dateFilter === 'THIS_MONTH' ? 'end' : 'middle'}
                  height={dateFilter === 'THIS_MONTH' ? 55 : 30}
                  tick={{ fontSize: dateFilter === 'THIS_MONTH' ? 10 : 11, fontWeight: 700 }} 
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} unit="L" />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Income (Lakhs)" />
                <Bar dataKey="totalExpenses" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={dateFilter === 'THIS_MONTH' ? 12 : 24} name="Expense (Lakhs)" />
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
                  {dynamicFinancialsChart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No income vs expense data available.</td>
                    </tr>
                  ) : (
                    dynamicFinancialsChart.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-900">{row.label}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{row.revenue} L</td>
                        <td className="p-3 font-bold text-rose-600">₹{row.totalExpenses} L</td>
                        <td className="p-3 font-bold text-blue-700">₹{row.netProfit} L</td>
                        <td className="p-3"><span className="badge badge-green text-[10px]">{(((row.netProfit)/(row.revenue || 1))*100).toFixed(1)}%</span></td>
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
              Welcome, {user?.name || 'Admin'}!
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button 
                onClick={() => exportDashboardAnalyticsPDF(dateFilter, currentMetrics, currentMetrics.productDistributionChart, currentMetrics.conversionClaimsChart, currentMetrics.staffPerformanceChart)} 
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
                title="Export Dashboard Analytics as PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Analytics:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setDateFilter('TODAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'TODAY' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setDateFilter('THIS_WEEK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'THIS_WEEK' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => setDateFilter('THIS_MONTH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'THIS_MONTH' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setDateFilter('LAST_MONTH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'LAST_MONTH' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Last Month
            </button>
            <button 
              onClick={() => setDateFilter('THIS_YEAR')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${dateFilter === 'THIS_YEAR' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Year
            </button>
            <button 
              onClick={() => setDateFilter('CUSTOM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1 ${dateFilter === 'CUSTOM' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Custom Date</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Selector (Visible when Custom Date is selected) */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 bg-slate-50/80 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600">From:</label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600">To:</label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {customStartDate && customEndDate && (
              <span className="badge badge-brand text-[10px]">
                Range: {customStartDate} ➔ {customEndDate}
              </span>
            )}
          </div>
        )}
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

        {/* NEW CARD 1 & 2: Company & Employee Expenditure (Admin Only) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <>
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
                ₹{(companyOperatingExpenses.totalAmount / 100000).toFixed(2)} L
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="badge bg-amber-100 text-amber-800 text-[10px]">
                  {companyOperatingExpenses.items.length > 0 ? `${companyOperatingExpenses.items.length} Database Records` : 'Rent, Software & Infra'}
                </span>
                <span className="text-[10px] font-extrabold text-amber-600 hover:underline flex items-center space-x-0.5">
                  <span>View Details</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            <div 
              onClick={() => setActiveModal('EMPLOYEE_SALARY_SPEND')}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-2 hover:border-rose-500 hover:shadow-lg transition cursor-pointer group relative"
              title="Click to view detailed staff payroll & salary spend breakdown"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase group-hover:text-rose-600 transition">Employee Salary Spend</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition"><TrendingDown className="h-4 w-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-900">
                ₹{(employeeSalarySpend.totalAmount / 100000).toFixed(2)} L
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="badge bg-rose-100 text-rose-800 text-[10px]">
                  {employeeSalarySpend.staffMembers.length} Active Staff Payroll
                </span>
                <span className="text-[10px] font-extrabold text-rose-600 hover:underline flex items-center space-x-0.5">
                  <span>View Details</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DASHBOARD LIVE CUSTOMER DIRECTORY */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Registered Customers &amp; Account Profiles</span>
            </h3>
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
          {displayedCustomers.map(c => (
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
          {displayedCustomers.length === 0 && (
            <div className="col-span-full p-6 text-center text-xs text-slate-400 font-semibold">
              No customers registered yet. Click "Customer Directory" to create your first customer.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN-ONLY INDIVIDUAL STAFF 360° ANALYTICS DESK & INTERACTIVE GRAPHS      */}
      {/* ========================================================================= */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          
          {/* Header & Staff Selector Dropdown */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="badge badge-brand text-[10px] uppercase font-black">Admin Master Control 🛡️</span>
                <span className="badge badge-purple text-[10px] uppercase font-black">Staff 360° Intelligence</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <span>Individual Staff Advisor 360° Performance Desk</span>
              </h2>
            </div>

            {/* Staff Advisor Selector Dropdown */}
            <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider whitespace-nowrap flex items-center space-x-1">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>Select Staff:</span>
              </label>
              <select
                value={selectedAdminStaffUid}
                onChange={(e) => setSelectedAdminStaffUid(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer min-w-[200px]"
              >
                {staffListState.map(st => (
                  <option key={st.uid} value={st.uid}>
                    {st.name} ({st.title || st.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Staff Profile Card Header */}
          {selectedAdminStaff && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-4">
                <div className="p-3.5 rounded-2xl bg-blue-600/30 text-blue-400 font-black border border-blue-400/30 shadow-inner">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-white">{selectedAdminStaff.name}</h3>
                    <span className="badge bg-blue-500/30 text-blue-300 border border-blue-400/40 text-[10px] font-black uppercase">
                      {selectedAdminStaff.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    {selectedAdminStaff.title || 'Staff Advisor'} • {selectedAdminStaff.branch || 'Chennai Head Office'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 font-semibold text-slate-300">
                    <span className="flex items-center space-x-1.5"><Mail className="h-3.5 w-3.5 text-blue-400" /><span className="font-mono text-slate-200">{selectedAdminStaff.email}</span></span>
                    <span className="flex items-center space-x-1.5"><Phone className="h-3.5 w-3.5 text-emerald-400" /><span>{selectedAdminStaff.phone || '9876543210'}</span></span>
                  </div>
                </div>
              </div>

              {/* Salary & Target Card */}
              <div className="flex flex-wrap items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-300 uppercase block">Fixed Monthly Salary</span>
                  <p className="text-lg font-black text-rose-400">
                    ₹{Number(selectedAdminStaff.fixedSalary !== undefined ? selectedAdminStaff.fixedSalary : 270000).toLocaleString()}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Monthly Business Target</span>
                  <p className="text-lg font-black text-amber-400">
                    ₹{((selectedAdminStaff.monthlyTarget || 500000) / 100000).toFixed(1)} Lakhs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Staff 4 Overview Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-blue-600">Assigned Customers</span>
              <p className="text-2xl font-black text-slate-900">{selectedStaff360Data.assignedCustomers.length}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Active Client Portfolios</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Total Business Handled</span>
              <p className="text-2xl font-black text-slate-900">
                ₹{(selectedStaff360Data.totalBusinessVolume / 100000).toFixed(2)} Lakhs
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">Gross Premium &amp; Portfolio</span>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-600">Policies Issued &amp; Closed</span>
              <p className="text-2xl font-black text-slate-900">{selectedStaff360Data.completedPoliciesCount}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Active Insurance Contracts</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-700">Leads &amp; Task Execution</span>
              <p className="text-2xl font-black text-slate-900">{selectedStaff360Data.staffLeads.length} Converted</p>
              <span className="text-[10px] text-slate-500 font-semibold">{selectedStaff360Data.staffFollowups.length} Tasks Executed</span>
            </div>
          </div>

          {/* 2 Dedicated Charts for Selected Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: Monthly Business & Policy Velocity */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center space-x-2 tracking-wider">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Monthly Revenue &amp; Policy Issuance Velocity</span>
                </h4>
                <span className="badge badge-brand text-[10px]">{selectedAdminStaff?.name}</span>
              </div>
              <div className="h-[260px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedStaff360Data.monthlyTrendChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <Tooltip 
                      formatter={(val, name) => [name === 'revenue' ? `₹${Number(val).toLocaleString()}` : `${val} Policies`, name === 'revenue' ? 'Business Volume' : 'Issued Policies']} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '8px' }} />
                    <Bar yAxisId="left" dataKey="revenue" name="Business Volume (₹)" fill="#1E6091" radius={[6, 6, 0, 0]} barSize={22} />
                    <Bar yAxisId="right" dataKey="policies" name="Issued Policies" fill="#10B981" radius={[6, 6, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: Policy Categories & Insurer Companies Distribution */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center space-x-2 tracking-wider">
                  <PieIcon className="h-4 w-4 text-emerald-600" />
                  <span>Policy Types &amp; Insurer Distribution</span>
                </h4>
                <span className="badge badge-green text-[10px]">Product Breakdown</span>
              </div>
              <div className="h-[260px] w-full pt-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedStaff360Data.categoryDistributionChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {selectedStaff360Data.categoryDistributionChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STAFF_PIE_COLORS[index % STAFF_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${val} Contracts / Shares`, 'Portfolio Distribution']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 4 Detail Audit Register Tabs */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>360° Breakdown Audit Records for {selectedAdminStaff?.name}</span>
              </h4>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveAdminStaffTab('CUSTOMERS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeAdminStaffTab === 'CUSTOMERS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Assigned Customers ({selectedStaff360Data.assignedCustomers.length})
                </button>
                <button
                  onClick={() => setActiveAdminStaffTab('POLICIES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeAdminStaffTab === 'POLICIES' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Issued Policies ({selectedStaff360Data.issuedPolicies.length})
                </button>
                <button
                  onClick={() => setActiveAdminStaffTab('LEADS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeAdminStaffTab === 'LEADS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Leads Pipeline ({selectedStaff360Data.staffLeads.length})
                </button>
                <button
                  onClick={() => setActiveAdminStaffTab('TASKS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeAdminStaffTab === 'TASKS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Tasks Audit ({selectedStaff360Data.staffFollowups.length})
                </button>
              </div>
            </div>

            {/* TAB 1: ASSIGNED CUSTOMERS TABLE */}
            {activeAdminStaffTab === 'CUSTOMERS' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Customer Code / Phone</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Active Policies</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStaff360Data.assignedCustomers.length > 0 ? (
                      selectedStaff360Data.assignedCustomers.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition font-semibold">
                          <td className="p-3">
                            <button
                              onClick={() => openCustomer360(c.name)}
                              className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer flex items-center space-x-1"
                            >
                              <span>{c.name}</span>
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            </button>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{c.customerCode || c.phone || 'SK-CUST-101'}</td>
                          <td className="p-3 text-slate-600">{c.city || 'Chennai'}</td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">Active Client</span></td>
                          <td className="p-3">
                            <button
                              onClick={() => openCustomer360(c.name)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-[10px] transition cursor-pointer"
                            >
                              View 360° Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-400 font-semibold">No assigned customer records found for this advisor.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: ISSUED POLICIES TABLE */}
            {activeAdminStaffTab === 'POLICIES' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Insurance Company</th>
                      <th className="p-3">Policy Type</th>
                      <th className="p-3">Sum Insured</th>
                      <th className="p-3">Premium (₹)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStaff360Data.issuedPolicies.length > 0 ? (
                      selectedStaff360Data.issuedPolicies.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50 transition font-semibold">
                          <td className="p-3 font-extrabold text-slate-900">{p.customerName || 'Rahul Sharma'}</td>
                          <td className="p-3 font-bold text-indigo-700">{p.provider || p.companyName || 'Star Health Insurance'}</td>
                          <td className="p-3"><span className="badge badge-brand text-[10px]">{p.policyType || 'Health Floater'}</span></td>
                          <td className="p-3 font-mono font-bold text-slate-700">₹{Number(p.sumInsured || 500000).toLocaleString()}</td>
                          <td className="p-3 font-black text-emerald-700">₹{Number(p.grossPremium || 25000).toLocaleString()}</td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">Active &amp; Issued</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="p-4 text-center text-slate-400 font-semibold">No active policy contracts registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: LEADS PIPELINE TABLE */}
            {activeAdminStaffTab === 'LEADS' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Lead Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Interest Product</th>
                      <th className="p-3">Lead Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStaff360Data.staffLeads.length > 0 ? (
                      selectedStaff360Data.staffLeads.map((l, idx) => (
                        <tr key={l.id || idx} className="hover:bg-slate-50 transition font-semibold">
                          <td className="p-3 font-extrabold text-slate-900">{l.name || l.leadName || 'Vikram Seth'}</td>
                          <td className="p-3 font-mono text-slate-600">{l.phone || '9876543210'}</td>
                          <td className="p-3 font-bold text-purple-700">{l.product || l.category || 'Term Insurance'}</td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">{l.status || 'CONVERTED'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="p-4 text-center text-slate-400 font-semibold">No assigned leads found for this staff member.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: TASKS AUDIT TABLE */}
            {activeAdminStaffTab === 'TASKS' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Task Description</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStaff360Data.staffFollowups.length > 0 ? (
                      selectedStaff360Data.staffFollowups.map((f, idx) => (
                        <tr key={f.id || idx} className="hover:bg-slate-50 transition font-semibold">
                          <td className="p-3 font-extrabold text-slate-900">{f.notes || f.title || f.subject || 'Policy Renewal Reminder'}</td>
                          <td className="p-3 text-slate-700">{f.customerName || 'Rahul Sharma'}</td>
                          <td className="p-3"><span className="badge badge-amber text-[10px]">{f.priority || 'HIGH'}</span></td>
                          <td className="p-3"><span className="badge badge-green text-[10px]">Completed ⚡</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="p-4 text-center text-slate-400 font-semibold">No pending or completed tasks found for this staff member.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DASHBOARD STAFF PERFORMANCE LEADERBOARDS (MANAGERS & ADMINS ONLY) */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'BRANCH_MANAGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEADERBOARD A: STAFF GENERATING MOST BUSINESS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span>1. Staff Doing Most Business (Revenue Leaderboard)</span>
                </h3>
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
              </div>
              <span className="badge badge-purple text-[10px] uppercase font-black">Client Workload 📊</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Staff Advisor</th>
                    <th className="p-3">Active Assigned</th>
                    <th className="p-3">Completed Clients</th>
                    <th className="p-3">Total Clients</th>
                    <th className="p-3">Portfolio Share</th>
                    <th className="p-3">Capacity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffClientLeaderboard.map((st, idx) => {
                    const totalCusts = customers.length || 1;
                    const pct = ((st.totalCount / totalCusts) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-black">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900 flex items-center space-x-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                          <span>{st.name}</span>
                        </td>
                        <td className="p-3 font-bold text-indigo-700">{st.activeCount} Active</td>
                        <td className="p-3 font-bold text-emerald-700">{st.completedCount} Completed</td>
                        <td className="p-3 font-black text-slate-900">{st.totalCount} Total</td>
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

      {/* EXECUTIVE BUSINESS ANALYTICS & PORTFOLIO DISTRIBUTION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: Monthly New Client Acquisitions & Policy Issuances */}
        <div 
          onClick={() => setActiveModal('CLIENT_ACQUISITIONS_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
          title="Click to view full client acquisition & policy issuance details"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5">
                <span>1. Monthly New Client Acquisitions &amp; Policy Issuances</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
            </div>
            <span className="badge badge-brand text-[10px]">Acquisitions 🔍</span>
          </div>

          <div className="h-[340px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
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
        </div>

        {/* GRAPH 2: Income vs Expense Variance */}
        <div 
          onClick={() => setActiveModal('INCOME_EXPENSE_CHART')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
          title="Click to view complete income vs expense variance breakdown"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition flex items-center space-x-1.5">
                <span>2. Income vs Expense Variance (Lakhs)</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
            </div>
            <span className="badge badge-green text-[10px]">Net Margin +64% 🔍</span>
          </div>

          <div className="h-[340px] w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
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
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} unit="L" />
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
            </div>
            <span className="badge badge-purple text-[10px]">Category Performance • Click Details 🔍</span>
          </div>
          <div className="h-64">
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
        </div>

        {/* GRAPH 4: Staff Advisor Performance Targets */}
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
            </div>
            <span className="badge badge-amber text-[10px]">Staff Leaderboard • Click Details 🔍</span>
          </div>
          <div className="h-64">
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
        </div>
      </div>

      {/* GRAPH 5: Product Portfolio Distribution Donut Chart */}
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
          </div>
          <span className="badge badge-brand text-[10px]">Product Mix • Click Details 🔍</span>
        </div>

        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dynamicProductDistributionChart}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
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
      </div>
    </div>
  );
};
