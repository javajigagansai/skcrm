import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useGeofence } from '../../context/GeofenceContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, LogOut, User, ChevronDown, CheckSquare, AlertCircle, Trash2, X, MapPin } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications, deleteNotification } = useNotification();
  const { geofenceConfig, distanceFromOffice } = useGeofence();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const prevCountRef = useRef(unreadNotificationCount);
  const shakeTimerRef = useRef(null);

  const isManagerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Trigger shake animation ONLY when a new notification arrives
  useEffect(() => {
    if (unreadNotificationCount > prevCountRef.current) {
      setIsShaking(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 5000); // Shakes for 5s to notify user
    }
    prevCountRef.current = unreadNotificationCount;
  }, [unreadNotificationCount]);

  useEffect(() => {
    const handleNewNotif = () => {
      setIsShaking(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 5000);
    };

    window.addEventListener('storage_notifications_updated', handleNewNotif);
    return () => {
      window.removeEventListener('storage_notifications_updated', handleNewNotif);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

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
        {/* Geofence Status Indicator */}
        {geofenceConfig?.enabled && (
          <div
            onClick={() => navigate('/settings')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black cursor-pointer hover:bg-emerald-100 transition shadow-2xs"
            title={`GPS Geofence Enforced: ${geofenceConfig.officeName || 'HQ'} (Distance: ${distanceFromOffice !== null ? (distanceFromOffice * 3.28084).toFixed(0) + 'ft / ' + distanceFromOffice + 'm' : 'verifying...'})`}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>HQ Geofence Active</span>
          </div>
        )}

        {/* User Role Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>{user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Manager' : 'Staff Advisor'}</span>
        </div>

        {/* Interactive Real-Time Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setIsShaking(false);
            }}
            className="p-2.5 rounded-2xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 relative transition cursor-pointer flex items-center justify-center" 
            title="Real-Time Notifications"
          >
            <Bell className={`h-5 w-5 transition-transform ${isShaking ? 'animate-bell-shake text-blue-600' : 'text-slate-600'}`} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-white shadow-md">
                <span>{unreadNotificationCount}</span>
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
                      Mark all as read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAllNotifications} 
                      className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="Clear All Notifications"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold">You are all caught up!</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No new notifications.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`p-3.5 flex items-start space-x-3 transition cursor-pointer group ${notif.read ? 'bg-white opacity-70 hover:opacity-100 hover:bg-slate-50' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        notif.type === 'BIRTHDAY' || notif.type === 'ANNIVERSARY' ? 'bg-purple-100 text-purple-600' :
                        notif.type === 'TASK' ? 'bg-blue-100 text-blue-600' :
                        notif.type === 'EXPENSE' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs truncate ${notif.read ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>{notif.title}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-0.5"
                            title="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold">Showing latest alerts &amp; reminders</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xs shadow">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-black text-slate-800 block truncate max-w-[120px]">{user?.name || 'User'}</span>
              <span className="text-[10px] font-extrabold text-slate-400 block -mt-0.5 capitalize">{user?.role?.toLowerCase() || 'Advisor'}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Panel */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-3xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-black text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                {isManagerOrAdmin && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center space-x-2 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>My Profile</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/special-days');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center space-x-2 cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5 text-slate-500" />
                  <span>Special Days</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
