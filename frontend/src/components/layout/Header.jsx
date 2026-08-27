import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, LogOut, User, ChevronDown, CheckSquare, AlertCircle, Trash2, X } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications, deleteNotification } = useNotification();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const isManagerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = async (notif) => {
    await markNotificationAsRead(notif.id);
    setShowNotifications(false);
    if (notif.taskId) {
      navigate('/tasks');
    } else if (notif.path) {
      navigate(notif.path);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-end sticky top-0 z-30 shadow-xs">
      {/* Header Right Actions */}
      <div className="flex items-center space-x-3">
        {/* User Role Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>{user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Manager' : user?.role === 'GREETINGS_OFFICER' ? 'Greetings Officer' : 'Staff Advisor'}</span>
        </div>

        {/* Interactive Real-Time Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-2xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 relative transition cursor-pointer flex items-center justify-center" 
            title="Real-Time Notifications"
          >
            <Bell className={`h-5 w-5 ${unreadNotificationCount > 0 ? 'animate-bell-shake text-blue-600' : 'animate-bell-shake text-slate-600'}`} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-white shadow-md animate-badge-move">
                <span className="animate-number-jiggle">{unreadNotificationCount}</span>
              </span>
            )}
          </button>

          {/* Notifications Panel Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Notifications</h3>
                </div>
                <div className="flex items-center space-x-2.5">
                  {unreadNotificationCount > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead} 
                      className="text-[10px] font-extrabold text-blue-300 hover:text-white transition cursor-pointer hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications} 
                      className="text-[10px] font-extrabold text-rose-300 hover:text-rose-100 transition cursor-pointer flex items-center space-x-1 hover:underline bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30"
                    >
                      <Trash2 className="h-3 w-3 inline" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <div 
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-50 transition flex items-start space-x-3 group relative ${(!n.isRead && !n.read) ? 'bg-blue-50/50 font-semibold' : 'bg-white'}`}
                  >
                    <div 
                      onClick={() => handleNotifClick(n)}
                      className={`p-2 rounded-xl shrink-0 mt-0.5 cursor-pointer ${n.type === 'TASK_ASSIGNED' ? 'bg-amber-100 text-amber-700' : n.type === 'NEW_MESSAGE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-600'}`}
                    >
                      {n.type === 'TASK_ASSIGNED' ? <CheckSquare className="h-4 w-4 text-amber-600" /> : <AlertCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div 
                      onClick={() => handleNotifClick(n)}
                      className="flex-1 space-y-0.5 cursor-pointer min-w-0 pr-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${(!n.isRead && !n.read) ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>{n.title}</p>
                        {(!n.isRead && !n.read) && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mr-1"></span>}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{n.message || n.desc}</p>
                      <span className="text-[10px] text-slate-400 font-bold block pt-1">
                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0 self-start mt-0.5"
                      title="Remove this notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                    No new notifications.
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100 flex items-center justify-center">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">SK SMART INVESTMENTS</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Direct Logout/Switch Login Link */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-200/60"
          >
            <div className="h-8 w-8 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center border border-white shadow-xs">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.charAt(0) : 'U'}</span>
              )}
            </div>
            <span className="text-xs font-extrabold text-slate-800 hidden md:inline">{user?.name || 'User'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              {isManagerOrAdmin && (
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                >
                  <User className="h-4 w-4 text-blue-600" />
                  <span>My Profile</span>
                </button>
              )}
              <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer border-t border-slate-100 mt-1 pt-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Switch / Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
