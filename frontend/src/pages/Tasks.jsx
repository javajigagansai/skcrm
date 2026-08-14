import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCustomer360 } from '../context/Customer360Context';
import { Plus, CheckSquare, Clock, AlertCircle, X, Sparkles } from 'lucide-react';

export const Tasks = () => {
  const { user } = useAuth();
  const { tasks, addTask, updateTaskStatus } = useData();
  const { openCustomer360 } = useCustomer360();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    customerName: '',
    description: '',
    assignedStaff: 'Priya Sharma',
    dueDate: '2026-08-15',
    priority: 'MEDIUM',
    status: 'PENDING'
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    await addTask(newTask);
    setShowAddModal(false);
    setNewTask({
      title: '',
      customerName: '',
      description: '',
      assignedStaff: 'Priya Sharma',
      dueDate: '2026-08-15',
      priority: 'MEDIUM',
      status: 'PENDING'
    });
    alert('Task created successfully!');
  };

  const handleStatusChange = (id, status) => {
    updateTaskStatus(id, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Task & Follow-up Desk</h1>
          <p className="text-xs text-slate-500 font-semibold">Assign tasks, track deadlines, and monitor advisor execution.</p>
        </div>
        {user?.role !== 'VIEWER' && (
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
        {tasks.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className={`badge ${t.priority === 'HIGH' ? 'badge-red' : 'badge-amber'}`}>{t.priority} PRIORITY</span>
              <select 
                value={t.status}
                onChange={(e) => handleStatusChange(t.id, e.target.value)}
                className="px-2.5 py-1 rounded-xl text-xs font-extrabold border bg-white"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
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
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-t pt-2">
              <span>Assigned To: {t.assignedStaff || t.assignedToName || 'Priya Sharma'}</span>
              <span>Due: {t.dueDate}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Assign New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Task Title</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Description</label>
                <textarea required value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none" rows="3"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-3 py-2 rounded-xl border text-xs outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow hover:bg-blue-700">Save Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
