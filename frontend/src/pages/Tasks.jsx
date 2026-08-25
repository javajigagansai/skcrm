import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { useCustomer360 } from '../context/Customer360Context';
import { Plus, CheckSquare, Clock, AlertCircle, X, Sparkles, UserCheck, Trash2, Lock } from 'lucide-react';

const DEFAULT_STAFF = ['Priya Sharma', 'Rahul Dravid', 'Kavita Menon', 'Anitha Selvam', 'Karthik Subramanian', 'Branch Manager'];

export const Tasks = () => {
  const { user } = useAuth();
  const { tasks, addTask, updateTaskStatus, deleteTask } = useData();
  const { sendNotification } = useNotification();
  const { openCustomer360 } = useCustomer360();
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdminOrManager = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_v2_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => u.name).filter(Boolean);
        }
      }
    } catch (e) {}
    return DEFAULT_STAFF;
  });

  useEffect(() => {
    const handleUsersUpdate = () => {
      try {
        const saved = localStorage.getItem('crm_v2_users_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStaffList(parsed.map(u => u.name).filter(Boolean));
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage_users_updated', handleUsersUpdate);
    return () => window.removeEventListener('storage_users_updated', handleUsersUpdate);
  }, []);

  const [newTask, setNewTask] = useState({
    title: '',
    customerName: '',
    description: '',
    assignedStaff: 'Priya Sharma',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    priority: 'MEDIUM',
    status: 'PENDING'
  });

  const isStaffAdvisor = user?.role === 'EMPLOYEE' || user?.role === 'USER';

  const visibleTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    if (!isStaffAdvisor) return tasks;

    const activeName = (user?.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];
    const activeEmail = (user?.email || '').toLowerCase().trim();
    const activeUid = user?.uid || '';

    return tasks.filter(t => {
      const assigned = (t.assignedStaff || t.assignedTo || t.staffName || '').toLowerCase().trim();
      const assignedEmail = (t.assignedEmail || t.staffEmail || '').toLowerCase().trim();

      if (assigned && (assigned === activeName || assigned.split(' ')[0] === activeFirst)) return true;
      if (assignedEmail && activeEmail && assignedEmail === activeEmail) return true;
      if (t.staffId && t.staffId === activeUid) return true;

      return false;
    });
  }, [tasks, user, isStaffAdvisor]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    const taskObj = {
      ...newTask,
      id: 'TASK-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString()
    };

    await addTask(taskObj);

    // Trigger Real-Time Notification in Firestore
    await sendNotification({
      recipientName: newTask.assignedStaff,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned 📋',
      message: `${newTask.title} (Due: ${newTask.dueDate}${newTask.dueTime ? ` at ${newTask.dueTime}` : ''}): ${newTask.description}`,
      taskId: taskObj.id
    });

    try {
      window.dispatchEvent(new Event('storage_tasks_updated'));
    } catch (err) {}

    setShowAddModal(false);
    setNewTask({
      title: '',
      customerName: '',
      description: '',
      assignedStaff: 'Priya Sharma',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
      priority: 'MEDIUM',
      status: 'PENDING'
    });
    alert(`Task "${taskObj.title}" created and assigned to ${taskObj.assignedStaff}! Real-time notification dispatched.`);
  };

  const handleStatusChange = (id, status) => {
    updateTaskStatus(id, status);
  };

  const handleDeleteTask = async (id, title) => {
    if (!isAdminOrManager) {
      alert('Access Restricted: Only Admin or Manager can delete tasks.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete task "${title}"?`)) {
      await deleteTask(id);
      try {
        window.dispatchEvent(new Event('storage_tasks_updated'));
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isStaffAdvisor ? 'My Assigned Tasks Desk' : 'Task & Follow-up Desk'}
          </h1>
          {isStaffAdvisor && (
            <p className="text-xs text-slate-500 font-semibold">
              Tasks assigned specifically to your staff profile for execution.
            </p>
          )}
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleTasks.length > 0 ? (
          visibleTasks.map(t => {
            const isAutoAssigned = t.autoGenerated && t.type === 'CUSTOMER_ASSIGNMENT';
            const isHigh   = t.priority === 'HIGH';
            const isDone   = t.status === 'COMPLETED' || t.status === 'CANCELLED';

            return (
              <div
                key={t.id}
                className={`bg-white p-5 rounded-2xl border-2 shadow-card space-y-3 transition-all ${
                  isAutoAssigned
                    ? 'border-purple-300 bg-gradient-to-br from-purple-50/60 to-blue-50/40'
                    : isDone
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${isHigh ? 'badge-red' : 'badge-amber'}`}>
                      {t.priority} PRIORITY
                    </span>
                    {isAutoAssigned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-100 text-purple-700 border border-purple-300">
                        <UserCheck className="h-3 w-3" />
                        Auto-Assigned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="px-2.5 py-1 rounded-xl text-xs font-extrabold border bg-white cursor-pointer"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    {isAdminOrManager ? (
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="p-1.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                        title="Delete Task (Admin/Manager Only)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="p-1.5 text-slate-300 cursor-not-allowed" title="Delete restricted to Admin/Manager">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{t.title}</h3>
                  {t.customerName && (
                    <button
                      onClick={() => openCustomer360(t.customerName)}
                      className="text-xs font-black text-blue-600 hover:underline flex items-center space-x-1 mt-0.5 cursor-pointer"
                    >
                      <span>Customer: {t.customerName}</span>
                      <Sparkles className="h-3 w-3 text-amber-500" />
                    </button>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-t pt-2">
                  <span className="flex items-center space-x-1">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>Assigned To: <strong className="text-slate-900">{t.assignedStaff || t.assignedToName || 'Staff'}</strong></span>
                  </span>
                  <span className={`flex items-center space-x-1 ${t.dueDate && new Date(t.dueDate) < new Date() && !isDone ? 'text-red-600 font-black' : 'text-slate-700 font-extrabold'}`}>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Due: {t.dueDate}{t.dueTime ? ` at ${t.dueTime}` : ''}</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-700">No Assigned Tasks Found</h3>
            <p className="text-xs text-slate-400">
              {isStaffAdvisor ? 'You have zero active tasks assigned to your staff profile right now!' : 'No tasks recorded in the CRM matching your criteria.'}
            </p>
          </div>
        )}
      </div>


      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Assign New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Task Title *</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-bold bg-white" />
              </div>
              
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Assign to Staff Advisor</label>
                <select 
                  value={newTask.assignedStaff} 
                  onChange={(e) => setNewTask({...newTask, assignedStaff: e.target.value})} 
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white cursor-pointer"
                >
                  {staffList.map((st, idx) => (
                    <option key={idx} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-medium bg-white" rows="3"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white cursor-pointer">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Due Time</label>
                  <input type="time" value={newTask.dueTime || ''} onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold bg-white" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-700 cursor-pointer">Save &amp; Assign Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
