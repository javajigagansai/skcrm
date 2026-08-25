import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCustomer360 } from '../context/Customer360Context';
import { useData } from '../context/DataContext';
import { exportFollowupsPDF, exportFollowupsExcel } from '../utils/exportUtils';
import { 
  Plus, Search, Calendar as CalendarIcon, CheckCircle2, Clock, X, Edit3, Trash2, 
  User, FileText, AlertCircle, ShieldCheck, Filter, UserCheck, MessageSquare, 
  ChevronRight, ArrowRight, Layers, Check, Sparkles, PhoneCall, Video, Users as UsersIcon, Download, FileSpreadsheet 
} from 'lucide-react';

export const Followups = () => {
  const { user } = useAuth();
  const { openCustomer360 } = useCustomer360();
  const { followups, addFollowup, customers = [] } = useData();
  const isAdminOrManager = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [viewMode, setViewMode] = useState('CLIENT_CONSOLIDATED'); // CLIENT_CONSOLIDATED or SPREADSHEET_TABLE
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState(isAdminOrManager ? 'ALL' : 'MY_ASSIGNED'); // ALL, MY_ASSIGNED, PENDING, COMPLETED

  const [showCreateNewClientModal, setShowCreateNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    selectedCustomerId: '',
    clientName: '',
    phone: '',
    category: 'High Networth Client',
    insuranceTypeInterest: 'Term & Savings Life Insurance',
    insuranceCompany: 'Tata AIA / Star Health',
    stageName: 'Prospect Onboarded & Requirement Captured',
    type: 'Phone Call',
    assignedTo: user?.name || 'Priya Sharma',
    date: 'Today, 05:00 PM',
    conversationNotes: '',
    status: 'PENDING'
  });

  const [showCustomerAutocomplete, setShowCustomerAutocomplete] = useState(false);

  const matchingCustomers = useMemo(() => {
    const term = (newClientForm.clientName || '').trim().toLowerCase();
    if (!term || term.length < 1) return [];
    return (customers || []).filter(c => {
      const name = (c.name || c.clientName || '').toLowerCase();
      const phone = (c.phone || c.mobile || c.contact || '').toLowerCase();
      const code = (c.customerCode || c.id || '').toLowerCase();
      return name.includes(term) || phone.includes(term) || code.includes(term);
    }).slice(0, 8);
  }, [customers, newClientForm.clientName]);

  const [selectedClientHistoryModal, setSelectedClientHistoryModal] = useState(null);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [targetClientForNewStage, setTargetClientForNewStage] = useState(null);

  const [showEditStageModal, setShowEditStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null);

  const [staffMembers, setStaffMembers] = useState(() => {
    const saved = localStorage.getItem('crm_v2_users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(u => u.name);
      } catch (e) {}
    }
    return ['Priya Sharma', 'Rahul Dravid', 'Kavita Menon', 'Branch Manager', 'Prakash Gajendiran'];
  });

  // Real-time listener for User Management updates
  useEffect(() => {
    const handleUsersUpdate = () => {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setStaffMembers(parsed.map(u => u.name));
        } catch (e) {}
      }
    };

    window.addEventListener('storage_users_updated', handleUsersUpdate);
    window.addEventListener('storage', handleUsersUpdate);
    return () => {
      window.removeEventListener('storage_users_updated', handleUsersUpdate);
      window.removeEventListener('storage', handleUsersUpdate);
    };
  }, []);

  const [newStageForm, setNewStageForm] = useState({
    stageName: '',
    date: 'Today, 05:00 PM',
    type: 'Phone Call',
    assignedTo: 'Priya Sharma',
    conversationNotes: '',
    status: 'PENDING'
  });

  const [clientData, setClientData] = useState(() => {
    const saved = localStorage.getItem('crm_v2_client_followup_hubs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        clientId: 'SK-CUST-101',
        clientName: 'Rahul Sharma',
        phone: '+91 98765 43210',
        category: 'High Networth Client',
        insuranceTypeInterest: 'Term & Savings Life Insurance',
        currentStage: 'Quotation Shared & Under Review',
        currentAssignedTo: 'Priya Sharma',
        currentCreatedBy: 'Branch Manager',
        overallStatus: 'PENDING',
        history: [
          { stepId: 'FLW-2026-101', stageName: 'Prospect Onboarded & Requirement Captured', date: '2026-08-10 10:30 AM', type: 'Branch Meeting', assignedTo: 'Priya Sharma', createdBy: 'Priya Sharma', conversationNotes: 'Client interested in ₹1 Cr Term Plan + ₹50,000/yr Guaranteed Savings Plan.', status: 'COMPLETED', isCurrentActive: false },
          { stepId: 'FLW-2026-102', stageName: 'Quotation Shared & Under Review', date: '2026-08-12 02:15 PM', type: 'Phone Call', assignedTo: 'Priya Sharma', createdBy: 'Branch Manager', conversationNotes: 'Shared Tata AIA & HDFC Life comparison quotes. Follow-up scheduled for decision.', status: 'PENDING', isCurrentActive: true }
        ]
      },
      {
        clientId: 'SK-CUST-102',
        clientName: 'Priya Menon',
        phone: '+91 98765 12345',
        category: 'Retail Investor',
        insuranceTypeInterest: 'Family Health Guard Policy',
        currentStage: 'Policy Issued & Closed',
        currentAssignedTo: 'Priya Sharma',
        currentCreatedBy: 'Priya Sharma',
        overallStatus: 'COMPLETED',
        history: [
          { stepId: 'FLW-2026-201', stageName: 'Health Insurance Plan Selected', date: '2026-08-08 11:00 AM', type: 'Phone Call', assignedTo: 'Priya Sharma', createdBy: 'Priya Sharma', conversationNotes: 'Selected Niva Bupa Health Companion ₹10 Lakhs floater policy.', status: 'COMPLETED', isCurrentActive: true }
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.getItem('crm_v2_client_followup_hubs');
      localStorage.setItem('crm_v2_client_followup_hubs', JSON.stringify(clientData));
    } catch (e) {}
  }, [clientData]);

  const [spreadsheetData, setSpreadsheetData] = useState(() => {
    const saved = localStorage.getItem('crm_v2_spreadsheet_followups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', date: '2026-08-10', category: 'High Networth Client', clientName: 'Rahul Sharma', phone: '+91 98765 43210', insuranceType: 'Term Life Insurance', insuranceCompany: 'Tata AIA Life', salesPitch: 'Guaranteed Return Savings Plan', clientStatus: 'Under Review', advisorNotes: 'Quotation shared, callback scheduled', assignedTo: 'Priya Sharma' },
      { id: '2', date: '2026-08-11', category: 'Retail Investor', clientName: 'Priya Menon', phone: '+91 98765 12345', insuranceType: 'Health Floater Guard', insuranceCompany: 'Niva Bupa Health', salesPitch: 'Family ₹10 Lakhs Coverage', clientStatus: 'Closed', advisorNotes: 'Policy issued & document sent', assignedTo: 'Priya Sharma' },
      { id: '3', date: '2026-08-12', category: 'Corporate Executive', clientName: 'Anand Kumar', phone: '+91 98765 67890', insuranceType: 'Comprehensive Motor Insurance', insuranceCompany: 'HDFC ERGO', salesPitch: 'Zero Dep Car Policy Renewal', clientStatus: 'Interested', advisorNotes: 'Discount quote sent via WhatsApp', assignedTo: 'Branch Manager' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('crm_v2_spreadsheet_followups', JSON.stringify(spreadsheetData));
    } catch (e) {}
  }, [spreadsheetData]);

  const dispatchFollowupNotifications = (clientName, stageName, assignedStaff, createdBy, status) => {
    try {
      const existing = JSON.parse(localStorage.getItem('crm_v2_admin_manager_notifications') || '[]');
      
      const mgmtNotif = {
        id: 'FLW-MGMT-' + Date.now(),
        type: 'followup_status',
        title: `👑 Admin & Manager Alert: ${clientName}`,
        desc: `Stage "${stageName}" assigned to ${assignedStaff} by ${createdBy} (${status}).`,
        time: 'Just now',
        read: false,
        path: '/followups',
        targetRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER']
      };

      const staffNotif = {
        id: 'FLW-STF-' + (Date.now() + 1),
        type: 'followup_assigned',
        title: `💼 Task Assigned to You (${assignedStaff})`,
        desc: `Client "${clientName}" stage "${stageName}" has been assigned to you by ${createdBy}. Scheduled status: ${status}.`,
        time: 'Just now',
        read: false,
        path: '/followups',
        targetStaffName: assignedStaff
      };

      localStorage.setItem('crm_v2_admin_manager_notifications', JSON.stringify([mgmtNotif, staffNotif, ...existing]));
    } catch (e) {}
  };

  const handleCreateNewClientFollowup = (e) => {
    e.preventDefault();
    if (!newClientForm.clientName || !newClientForm.phone || !newClientForm.stageName) {
      alert('Please fill in Client Name, Mobile Number, and Follow-up Stage Title!');
      return;
    }

    const newClientId = `SK-CUST-${Math.floor(100 + Math.random() * 900)}`;
    const stepId = `FLW-2026-${Math.floor(100 + Math.random() * 900)}`;
    const createdByStr = `${user?.name || 'Admin'} (${user?.roleDisplayName || 'Staff'})`;

    const newHubObj = {
      clientId: newClientId,
      clientName: newClientForm.clientName,
      phone: newClientForm.phone,
      category: newClientForm.category,
      insuranceTypeInterest: newClientForm.insuranceTypeInterest,
      currentStage: newClientForm.stageName,
      currentAssignedTo: newClientForm.assignedTo,
      currentCreatedBy: createdByStr,
      overallStatus: newClientForm.status,
      history: [
        {
          stepId: stepId,
          stageName: newClientForm.stageName,
          date: newClientForm.date || 'Today, 05:00 PM',
          type: newClientForm.type,
          assignedTo: newClientForm.assignedTo,
          createdBy: createdByStr,
          conversationNotes: newClientForm.conversationNotes || 'Initial follow-up registered.',
          status: newClientForm.status,
          isCurrentActive: true
        }
      ]
    };

    const newSpreadsheetObj = {
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      clientCategory: newClientForm.category,
      clientName: newClientForm.clientName,
      phone: newClientForm.phone,
      insuranceType: newClientForm.insuranceTypeInterest,
      insuranceCompany: newClientForm.insuranceCompany || 'Tata AIA / Star Health',
      salesPitch: newClientForm.stageName,
      clientStatus: newClientForm.status === 'COMPLETED' ? 'Closed' : 'Under Review',
      advisorNotes: newClientForm.conversationNotes || 'Initial follow-up registered.',
      assignedTo: newClientForm.assignedTo
    };

    setClientData(prev => [newHubObj, ...prev]);
    setSpreadsheetData(prev => [newSpreadsheetObj, ...prev]);

    dispatchFollowupNotifications(
      newClientForm.clientName,
      newClientForm.stageName,
      newClientForm.assignedTo,
      createdByStr,
      newClientForm.status
    );

    setShowCreateNewClientModal(false);
    setNewClientForm({
      selectedCustomerId: '',
      clientName: '',
      phone: '',
      category: 'High Networth Client',
      insuranceTypeInterest: 'Term & Savings Life Insurance',
      insuranceCompany: 'Tata AIA / Star Health',
      stageName: 'Prospect Onboarded & Requirement Captured',
      type: 'Phone Call',
      assignedTo: user?.name || 'Priya Sharma',
      date: 'Today, 05:00 PM',
      conversationNotes: '',
      status: 'PENDING'
    });

    alert(`New Client Follow-up for "${newClientForm.clientName}" created successfully & notification sent to ${newClientForm.assignedTo}!`);
  };

  const handleAddStage = (e) => {
    e.preventDefault();
    if (!targetClientForNewStage || !newStageForm.stageName) return;

    const formattedId = `FLW-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newStepObj = {
      stepId: formattedId,
      stageName: newStageForm.stageName,
      date: newStageForm.date,
      type: newStageForm.type,
      assignedTo: newStageForm.assignedTo,
      createdBy: `${user?.name || 'Admin'} (${user?.roleDisplayName || 'Staff'})`,
      conversationNotes: newStageForm.conversationNotes,
      status: newStageForm.status,
      isCurrentActive: true
    };

    const updated = clientData.map(client => {
      if (client.clientId === targetClientForNewStage.clientId) {
        const updatedHistory = client.history.map(h => ({ ...h, isCurrentActive: false }));
        return {
          ...client,
          currentStage: newStepObj.stageName,
          currentAssignedTo: newStepObj.assignedTo,
          currentCreatedBy: newStepObj.createdBy,
          overallStatus: newStepObj.status,
          history: [...updatedHistory, newStepObj]
        };
      }
      return client;
    });

    setClientData(updated);
    dispatchFollowupNotifications(
      targetClientForNewStage.clientName,
      newStepObj.stageName,
      newStepObj.assignedTo,
      newStepObj.createdBy,
      newStepObj.status
    );

    setShowAddStageModal(false);
    setTargetClientForNewStage(null);
    setNewStageForm({
      stageName: '',
      date: 'Today, 05:00 PM',
      type: 'Phone Call',
      assignedTo: 'Priya Sharma',
      conversationNotes: '',
      status: 'PENDING'
    });
    alert(`New follow-up stage added for ${targetClientForNewStage.clientName} & notification sent to ${newStepObj.assignedTo}!`);
  };

  const handleSaveEditStage = (e) => {
    e.preventDefault();
    if (!editingStage || !editingClientId) return;

    const updated = clientData.map(client => {
      if (client.clientId === editingClientId) {
        const updatedHistory = client.history.map(h => h.stepId === editingStage.stepId ? editingStage : h);
        const lastStep = updatedHistory[updatedHistory.length - 1];
        return {
          ...client,
          currentStage: lastStep.stageName,
          currentAssignedTo: lastStep.assignedTo,
          currentCreatedBy: lastStep.createdBy,
          overallStatus: lastStep.status,
          history: updatedHistory
        };
      }
      return client;
    });

    setClientData(updated);
    dispatchFollowupNotifications(
      `Step ${editingStage.stepId}`,
      editingStage.stageName,
      editingStage.assignedTo,
      `${user?.name || 'Staff'}`,
      editingStage.status
    );

    setShowEditStageModal(false);
    setEditingStage(null);
    setEditingClientId(null);
    alert(`Follow-up step ${editingStage.stepId} updated & notification sent to ${editingStage.assignedTo}!`);
  };

  const handleDeleteClientFollowup = (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to completely delete the follow-up record for "${clientName}"? This will remove all associated stages and history.`)) {
      setClientData(prev => prev.filter(c => c.clientId !== clientId));
      setSpreadsheetData(prev => prev.filter(s => s.clientName !== clientName));
      if (selectedClientHistoryModal?.clientId === clientId) {
        setSelectedClientHistoryModal(null);
      }
      alert(`Follow-up record for "${clientName}" has been deleted successfully!`);
    }
  };

  const handleDeleteStage = (clientId, stepId) => {
    const client = clientData.find(c => c.clientId === clientId);
    if (!client) return;

    if (client.history.length <= 1) {
      if (window.confirm(`This is the only stage for "${client.clientName}". Deleting it will remove the customer follow-up record completely. Proceed?`)) {
        handleDeleteClientFollowup(clientId, client.clientName);
      }
      return;
    }

    if (window.confirm(`Are you sure you want to delete follow-up step ${stepId}?`)) {
      const updated = clientData.map(c => {
        if (c.clientId === clientId) {
          const updatedHistory = c.history.filter(h => h.stepId !== stepId);
          const lastIdx = updatedHistory.length - 1;
          const finalHistory = updatedHistory.map((h, i) => ({
            ...h,
            isCurrentActive: i === lastIdx
          }));
          const lastStep = finalHistory[lastIdx];
          return {
            ...c,
            currentStage: lastStep.stageName,
            currentAssignedTo: lastStep.assignedTo,
            currentCreatedBy: lastStep.createdBy,
            overallStatus: lastStep.status,
            history: finalHistory
          };
        }
        return c;
      });
      setClientData(updated);
      alert(`Step ${stepId} deleted successfully!`);
    }
  };

  const handleDeleteSpreadsheetFollowup = (id, clientName) => {
    if (window.confirm(`Are you sure you want to delete this follow-up entry for "${clientName}"?`)) {
      setSpreadsheetData(prev => prev.filter(s => s.id !== id));
      alert(`Follow-up entry for "${clientName}" has been deleted!`);
    }
  };

  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER' || user?.role === 'STAFF';

  const isFollowupAssignedToStaff = (item) => {
    // Admins and Managers see all follow-ups
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      return true;
    }

    if (!user || (!user.name && !user.email)) return false;

    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];
    const activeEmail = (user.email || '').toLowerCase().trim();
    const activeUid = user.uid || '';

    const assignedName = (item.currentAssignedTo || item.assignedTo || item.assignedStaff || '').toLowerCase().trim();
    const assignedEmail = (item.assignedEmail || item.assignedToEmail || '').toLowerCase().trim();
    const createdByName = (item.currentCreatedBy || item.createdBy || '').toLowerCase().trim();

    if (assignedName && (assignedName === activeName || (activeFirst.length > 2 && assignedName.split(' ')[0] === activeFirst))) return true;
    if (assignedEmail && activeEmail && assignedEmail === activeEmail) return true;
    if (item.assignedToId && item.assignedToId === activeUid) return true;
    if (createdByName && (createdByName.includes(activeName) || (activeFirst.length > 2 && createdByName.includes(activeFirst)))) return true;

    // Check if any stage in client history is assigned to staff
    if (item.history && Array.isArray(item.history)) {
      const hasHistoryMatch = item.history.some(h => {
        const hName = (h.assignedTo || '').toLowerCase().trim();
        const cName = (h.createdBy || '').toLowerCase().trim();
        return hName === activeName || (activeFirst.length > 2 && hName.split(' ')[0] === activeFirst) || (cName && cName.includes(activeName));
      });
      if (hasHistoryMatch) return true;
    }

    // STRICT PRIVACY: Do NOT show follow-ups assigned to other staff members!
    return false;
  };

  const filteredClients = (clientData || []).filter(client => {
    const isAssigned = isFollowupAssignedToStaff(client);

    // If search term is present, perform comprehensive matching across all fields
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const rawTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const rawPhone = (client.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const nameMatch = (client.clientName || '').toLowerCase().includes(term);
      const phoneMatch = (client.phone || '').toLowerCase().includes(term) || (rawTerm.length > 2 && rawPhone.includes(rawTerm));
      const idMatch = (client.clientId || '').toLowerCase().includes(term);
      const categoryMatch = (client.category || '').toLowerCase().includes(term);
      const insuranceTypeMatch = (client.insuranceTypeInterest || '').toLowerCase().includes(term);
      const stageMatch = (client.currentStage || '').toLowerCase().includes(term);
      const assignedMatch = (client.currentAssignedTo || '').toLowerCase().includes(term);
      const createdByMatch = (client.currentCreatedBy || '').toLowerCase().includes(term);
      const statusMatch = (client.overallStatus || '').toLowerCase().includes(term);

      const historyMatch = (client.history || []).some(h => 
        (h.stageName || '').toLowerCase().includes(term) ||
        (h.conversationNotes || '').toLowerCase().includes(term) ||
        (h.assignedTo || '').toLowerCase().includes(term) ||
        (h.createdBy || '').toLowerCase().includes(term) ||
        (h.stepId || '').toLowerCase().includes(term) ||
        (h.type || '').toLowerCase().includes(term) ||
        (h.status || '').toLowerCase().includes(term) ||
        (h.date || '').toLowerCase().includes(term)
      );

      const matchesSearch = nameMatch || phoneMatch || idMatch || categoryMatch || insuranceTypeMatch || 
                            stageMatch || assignedMatch || createdByMatch || statusMatch || historyMatch;

      if (!matchesSearch) return false;
      return true;
    }

    // When NOT searching, enforce staff privacy filter and tab filters
    if (!isAssigned) return false;

    if (filterTab === 'PENDING') {
      return client.overallStatus === 'PENDING' || client.overallStatus === 'IN_PROGRESS';
    } else if (filterTab === 'COMPLETED') {
      return client.overallStatus === 'COMPLETED';
    }

    return true;
  });

  const filteredSpreadsheet = (spreadsheetData || []).filter(f => {
    const isAssigned = isFollowupAssignedToStaff(f);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const rawTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const rawPhone = (f.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const matchesSearch = 
        (f.clientName || '').toLowerCase().includes(term) ||
        (f.phone || '').toLowerCase().includes(term) ||
        (rawTerm.length > 2 && rawPhone.includes(rawTerm)) ||
        (f.clientCategory || f.category || '').toLowerCase().includes(term) ||
        (f.insuranceType || '').toLowerCase().includes(term) ||
        (f.insuranceCompany || '').toLowerCase().includes(term) ||
        (f.salesPitch || '').toLowerCase().includes(term) ||
        (f.clientStatus || '').toLowerCase().includes(term) ||
        (f.advisorNotes || '').toLowerCase().includes(term) ||
        (f.assignedTo || '').toLowerCase().includes(term) ||
        (f.date || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;
      return true;
    }

    if (!isAssigned) return false;

    return true;
  });

  const exportDataList = useMemo(() => {
    const list = [];
    (clientData || []).forEach(c => {
      (c.history || []).forEach(h => {
        list.push({
          date: h.date,
          clientCategory: c.category,
          prospectName: c.clientName,
          phone: c.phone,
          insuranceType: c.insuranceTypeInterest,
          insuranceCompany: 'Star Health / Tata AIA',
          salesPitch: h.stageName,
          clientStatus: h.status,
          advisorNotes: h.conversationNotes
        });
      });
    });
    return list;
  }, [clientData]);

  return (
    <div className="space-y-6">
      {/* HEADER BAR WITH EXPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Follow-ups</h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button 
            type="button"
            onClick={() => setShowCreateNewClientModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer shrink-0"
            title="Create New Client Follow-up Record"
          >
            <Plus className="h-4 w-4" />
            <span>Add Follow-up</span>
          </button>

          {isAdminOrManager && (
            <>
              <button 
                onClick={() => exportFollowupsPDF(exportDataList)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download PDF Report"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Report</span>
              </button>

              <button 
                onClick={() => exportFollowupsExcel(exportDataList)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Download Excel (.xlsx) Spreadsheet"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </>
          )}

          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setViewMode('CLIENT_CONSOLIDATED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${viewMode === 'CLIENT_CONSOLIDATED' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}
            >
              <UsersIcon className="h-3.5 w-3.5" />
              <span>Single Customer Progression Mode</span>
            </button>
            <button
              onClick={() => setViewMode('SPREADSHEET_TABLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${viewMode === 'SPREADSHEET_TABLE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Follow-up Register View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search Customer Name, Phone, Notes, Stage, Category, or Officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear Search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl">
          {isAdminOrManager ? (
            <button 
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${filterTab === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Records
            </button>
          ) : (
            <button 
              onClick={() => setFilterTab('MY_ASSIGNED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${filterTab === 'MY_ASSIGNED' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              My Assigned Follow-ups
            </button>
          )}
          <button 
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${filterTab === 'PENDING' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            In Progress / Pending
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SINGLE CLIENT CONSOLIDATED CARDS (1 Card per Client with Full Progression) */}
      {viewMode === 'CLIENT_CONSOLIDATED' ? (
        <div className="space-y-6">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">No Customer Follow-ups Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently 0 active follow-up records. Add a follow-up stage or customer to begin tracking progression.
              </p>
              <button 
                type="button"
                onClick={() => setShowCreateNewClientModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow transition cursor-pointer inline-flex items-center space-x-1.5 mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Follow-up</span>
              </button>
            </div>
          ) : (
            filteredClients.map((client) => {
              const currentStep = client.history[client.history.length - 1];
              return (
                <div key={client.clientId} className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-5 hover:border-blue-300 transition">
                {/* Client Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {client.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openCustomer360(client.clientName)}
                          className="text-base font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                          title="Click to view Customer 360° Profile"
                        >
                          <span>{client.clientName}</span>
                          <Sparkles className="h-3.5 w-3.5 text-blue-500 opacity-80" />
                        </button>
                        <span className="badge badge-brand text-[10px]">{client.clientId}</span>
                        <span className={`badge text-[10px] ${client.overallStatus === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`}>
                          {client.overallStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        📞 <strong className="font-mono text-slate-700">{client.phone}</strong> • {client.city} • Product: <strong>{client.activeProduct}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => openCustomer360(client.clientName)}
                      className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs border border-purple-200 transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                      title="Open Customer 360° Complete Profile"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      <span>Customer 360°</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setTargetClientForNewStage(client); setShowAddStageModal(true); }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Follow-up Stage</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedClientHistoryModal(client)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      <span>Full Lifecycle ({client.history.length} Steps)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClientFollowup(client.clientId, client.clientName)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer flex items-center space-x-1.5"
                      title="Delete Customer Follow-up Completely"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* CURRENT ACTIVE STAGE BANNER */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="badge bg-amber-400 text-slate-950 font-black text-[10px]">CURRENT ACTIVE STAGE</span>
                      <span className="font-mono text-xs text-blue-300 font-bold">Follow-up #{currentStep.stepId}</span>
                    </div>
                    <h4 className="text-sm font-black text-white">{currentStep.stageName}</h4>
                    <p className="text-xs text-slate-300 font-normal bg-white/10 p-2.5 rounded-xl border border-white/10 mt-1">
                      💬 <strong>Latest Conversation Topic:</strong> "{currentStep.conversationNotes}"
                    </p>
                  </div>

                  <div className="shrink-0 space-y-1 text-right border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
                    <div className="text-xs text-slate-300 font-semibold">
                      👤 Assigned Officer: <strong className="text-amber-300 font-bold">{currentStep.assignedTo}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ✍️ Assigned By: <span className="text-purple-300 font-semibold">{currentStep.createdBy}</span>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold">
                      📅 Scheduled: {currentStep.date}
                    </div>
                  </div>
                </div>

                {/* VISUAL TIMELINE PROGRESSION BAR ("FROM WHERE TO WHERE THE FOLLOW-UP IS GOING ON") */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Follow-up Lifecycle Progression ("From Start to Current Stage"):</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                    {client.history.map((step, sIdx) => {
                      const isCompleted = step.status === 'COMPLETED';
                      const isCurrent = step.isCurrentActive;

                      return (
                        <div 
                          key={step.stepId} 
                          className={`p-3.5 rounded-2xl border transition relative space-y-2 ${
                            isCurrent 
                              ? 'bg-blue-50/80 border-blue-400 shadow-sm' 
                              : isCompleted 
                              ? 'bg-emerald-50/40 border-emerald-200' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-black text-slate-500">Step {sIdx + 1}: {step.stepId}</span>
                            <span className={`badge text-[9px] font-black ${
                              isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'badge-green' : 'badge-amber'
                            }`}>
                              {isCurrent ? 'ACTIVE NOW' : step.status}
                            </span>
                          </div>

                          <div>
                            <h5 className="text-xs font-black text-slate-900">{step.stageName}</h5>
                            <p className="text-[10px] text-slate-500 font-bold">{step.date} • {step.type}</p>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 italic font-normal">
                            "{step.conversationNotes}"
                          </p>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="font-extrabold text-slate-800">👤 {step.assignedTo}</span>
                            <div className="flex items-center space-x-2">
                              <button 
                                type="button"
                                onClick={() => { setEditingStage({ ...step }); setEditingClientId(client.clientId); setShowEditStageModal(true); }}
                                className="text-blue-600 hover:underline font-extrabold flex items-center space-x-0.5 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteStage(client.clientId, step.stepId)}
                                className="text-rose-600 hover:underline font-extrabold flex items-center space-x-0.5 cursor-pointer"
                                title="Delete Step"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      ) : (
        /* VIEW MODE 2: SAMPLE SPREADSHEET TABLE (19 Entries Matching Image) */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5 border-r border-slate-800">Date</th>
                  <th className="p-3.5 border-r border-slate-800">Customer Category</th>
                  <th className="p-3.5 border-r border-slate-800">Customer Name</th>
                  <th className="p-3.5 border-r border-slate-800">Mobile Number</th>
                  <th className="p-3.5 border-r border-slate-800">Type Of Insurance</th>
                  <th className="p-3.5 border-r border-slate-800">Insurance Company</th>
                  <th className="p-3.5 border-r border-slate-800">Sales Pitch</th>
                  <th className="p-3.5 border-r border-slate-800">Customer Status</th>
                  <th className="p-3.5 border-r border-slate-800">Advisor Notes</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                {filteredSpreadsheet.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400 font-bold">
                      No spreadsheet follow-up records registered.
                    </td>
                  </tr>
                ) : (
                  filteredSpreadsheet.map((f, idx) => {
                  const isHealth = f.insuranceType === 'HEALTH';
                  return (
                    <tr 
                      key={f.id || idx} 
                      className={`transition hover:bg-blue-50/60 ${isHealth ? 'bg-orange-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200/80 font-mono">{f.date}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className={`badge text-[10px] ${f.clientCategory === 'New Lead' ? 'bg-blue-100 text-blue-800 font-extrabold' : 'bg-purple-100 text-purple-800 font-extrabold'}`}>
                          {f.clientCategory}
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <button
                          onClick={() => openCustomer360(f.clientName)}
                          className="font-black text-slate-900 hover:text-blue-600 hover:underline transition cursor-pointer text-left flex items-center space-x-1"
                          title="Click to view Customer 360° Profile"
                        >
                          <span>{f.clientName}</span>
                          <Sparkles className="h-3 w-3 text-blue-500 opacity-80" />
                        </button>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200/80">{f.phone}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className={`badge text-[10px] font-black ${isHealth ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {f.insuranceType}
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-blue-900 border-r border-slate-200/80">{f.insuranceCompany}</td>
                      <td className="p-3.5 font-bold text-slate-800 border-r border-slate-200/80">{f.salesPitch}</td>
                      <td className="p-3.5 border-r border-slate-200/80">
                        <span className="badge bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                          {f.clientStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 italic font-medium border-r border-slate-200/80">{f.advisorNotes}</td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSpreadsheetFollowup(f.id, f.clientName)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition cursor-pointer inline-flex items-center justify-center"
                          title="Delete Follow-up Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL TIMELINE HISTORY MODAL */}
      {selectedClientHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Complete Follow-up Timeline: {selectedClientHistoryModal.clientName}</h3>
                <p className="text-xs text-slate-500 font-medium">Tracking all steps from initial inquiry to current active status.</p>
              </div>
              <button onClick={() => setSelectedClientHistoryModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedClientHistoryModal.history.map((step, idx) => (
                <div key={step.stepId} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-blue-600 text-white font-mono text-[10px]">Step {idx + 1}: {step.stepId}</span>
                    <span className="text-xs font-bold text-slate-500">{step.date}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{step.stageName}</h4>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">{step.conversationNotes}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span>👤 Assigned: <strong>{step.assignedTo}</strong> • ✍️ By: <strong>{step.createdBy}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteStage(selectedClientHistoryModal.clientId, step.stepId);
                        const remaining = selectedClientHistoryModal.history.filter(h => h.stepId !== step.stepId);
                        if (remaining.length === 0) {
                          setSelectedClientHistoryModal(null);
                        } else {
                          setSelectedClientHistoryModal({ ...selectedClientHistoryModal, history: remaining });
                        }
                      }}
                      className="text-rose-600 hover:underline font-extrabold flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete Step</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setSelectedClientHistoryModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close History Window
            </button>
          </div>
        </div>
      )}

      {/* ADD NEXT FOLLOW-UP STAGE MODAL */}
      {showAddStageModal && targetClientForNewStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Add Next Follow-up Stage for {targetClientForNewStage.clientName}</h3>
              <button onClick={() => setShowAddStageModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleAddStage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Stage Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder=""
                  value={newStageForm.stageName} 
                  onChange={(e) => setNewStageForm({ ...newStageForm, stageName: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Topic of Conversation &amp; Detailed Notes</label>
                <textarea 
                  rows="3" 
                  required 
                  placeholder=""
                  value={newStageForm.conversationNotes} 
                  onChange={(e) => setNewStageForm({ ...newStageForm, conversationNotes: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none" 
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assign to Staff Member</label>
                  <select 
                    value={newStageForm.assignedTo} 
                    onChange={(e) => setNewStageForm({ ...newStageForm, assignedTo: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    {staffMembers.map(staff => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Scheduled Time</label>
                  <input 
                    type="text" 
                    required 
                    value={newStageForm.date} 
                    onChange={(e) => setNewStageForm({ ...newStageForm, date: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold text-blue-700" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow">Save &amp; Progress Follow-up Stage</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FOLLOW-UP STAGE MODAL */}
      {showEditStageModal && editingStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Follow-up Step {editingStage.stepId}</h3>
              <button onClick={() => setShowEditStageModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditStage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Stage Title</label>
                <input 
                  type="text" 
                  required 
                  value={editingStage.stageName} 
                  onChange={(e) => setEditingStage({ ...editingStage, stageName: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Topic of Conversation &amp; Detailed Notes</label>
                <textarea 
                  rows="3" 
                  required 
                  value={editingStage.conversationNotes} 
                  onChange={(e) => setEditingStage({ ...editingStage, conversationNotes: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none" 
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Staff Member</label>
                  <select 
                    value={editingStage.assignedTo} 
                    onChange={(e) => setEditingStage({ ...editingStage, assignedTo: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    {staffMembers.map(staff => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Step Status</label>
                  <select 
                    value={editingStage.status} 
                    onChange={(e) => setEditingStage({ ...editingStage, status: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow">Save Step Changes</button>
            </form>
          </div>
        </div>
      )}
      {/* CREATE NEW CLIENT FOLLOW-UP MODAL */}
      {showCreateNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span>Create New Client Follow-up</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Add a new customer or prospect to your active follow-up pipeline</p>
              </div>
              <button onClick={() => setShowCreateNewClientModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClientFollowup} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer / Prospect Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder=""
                    value={newClientForm.clientName} 
                    onChange={(e) => {
                      setNewClientForm({ ...newClientForm, clientName: e.target.value });
                      setShowCustomerAutocomplete(true);
                    }} 
                    onFocus={() => setShowCustomerAutocomplete(true)}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100" 
                  />

                  {/* LIVE CRM CUSTOMER 360 AUTOCOMPLETE DROPDOWN */}
                  {showCustomerAutocomplete && matchingCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 flex items-center justify-between">
                        <span>🔍 Verified CRM Customers ({matchingCustomers.length})</span>
                        <span className="text-[9px] text-blue-600 font-bold">Click to Auto-fill</span>
                      </div>
                      {matchingCustomers.map((c) => (
                        <button
                          key={c.id || c.uid || c.customerCode}
                          type="button"
                          onClick={() => {
                            setNewClientForm(prev => ({
                              ...prev,
                              selectedCustomerId: c.id || c.uid || c.customerCode || '',
                              clientName: c.name || c.clientName || '',
                              phone: c.phone || c.mobile || c.contact || prev.phone,
                              category: c.category || prev.category
                            }));
                            setShowCustomerAutocomplete(false);
                          }}
                          className="w-full text-left p-2.5 hover:bg-blue-50/80 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700">{c.name || c.clientName}</span>
                              <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">Customer 360</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-2">
                              <span>📞 <strong className="font-mono text-slate-700">{c.phone || c.mobile || 'No Phone'}</strong></span>
                              {c.city && <span>• {c.city}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">Auto-fill ➔</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Mobile Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder=""
                    value={newClientForm.phone} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-mono font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Customer Category</label>
                  <select 
                    value={newClientForm.category} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, category: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    <option value="High Networth Client">High Networth Customer</option>
                    <option value="Retail Investor">Retail Investor</option>
                    <option value="Corporate Executive">Corporate Executive</option>
                    <option value="SME Business Owner">SME Business Owner</option>
                    <option value="NRI Investor">NRI Investor</option>
                    <option value="New Lead">New Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Product / Insurance Interest</label>
                  <select 
                    value={newClientForm.insuranceTypeInterest} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, insuranceTypeInterest: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    <option value="Term & Savings Life Insurance">Term &amp; Savings Life Insurance</option>
                    <option value="Family Health Guard Policy">Family Health Guard Policy</option>
                    <option value="Comprehensive Motor Insurance">Comprehensive Motor Insurance</option>
                    <option value="Mutual Funds & SIP">Mutual Funds &amp; SIP</option>
                    <option value="ULIP & Retirement Plan">ULIP &amp; Retirement Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Initial Follow-up Stage Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder=""
                  value={newClientForm.stageName} 
                  onChange={(e) => setNewClientForm({ ...newClientForm, stageName: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold text-blue-900" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Initial Conversation Notes / Topic</label>
                <textarea 
                  rows="2" 
                  placeholder=""
                  value={newClientForm.conversationNotes} 
                  onChange={(e) => setNewClientForm({ ...newClientForm, conversationNotes: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none" 
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Interaction Type</label>
                  <select 
                    value={newClientForm.type} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, type: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="Branch Meeting">Branch Meeting</option>
                    <option value="WhatsApp Message">WhatsApp Message</option>
                    <option value="Video Call">Video Call</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assigned Officer</label>
                  <select 
                    value={newClientForm.assignedTo} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, assignedTo: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    {staffMembers.map(staff => (
                      <option key={staff} value={staff}>{staff}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Status</label>
                  <select 
                    value={newClientForm.status} 
                    onChange={(e) => setNewClientForm({ ...newClientForm, status: e.target.value })} 
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Scheduled Date &amp; Time</label>
                <input 
                  type="text" 
                  value={newClientForm.date} 
                  onChange={(e) => setNewClientForm({ ...newClientForm, date: e.target.value })} 
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold text-blue-700" 
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateNewClientModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  Create Follow-up Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
