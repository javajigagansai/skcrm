import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebaseClient';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to filter notifications targeted to active user
  const filterNotificationsForUser = (notifList) => {
    if (!user) return [];
    const activeName = (user.name || '').toLowerCase().trim();
    const activeFirst = activeName.split(' ')[0];
    const activeEmail = (user.email || '').toLowerCase().trim();
    const activeUid = user.uid || '';
    const activeRole = user.role || '';

    return notifList.filter(item => {
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
      if (item.forAll === true) return true;
      if (item.recipientId && item.recipientId === activeUid) return true;
      if (item.recipientEmail && item.recipientEmail.toLowerCase() === activeEmail) return true;
      if (item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes(activeRole)) return true;

      if (item.recipientName) {
        const recName = item.recipientName.toLowerCase().trim();
        const recFirst = recName.split(' ')[0];
        if (recName === activeName || recFirst === activeFirst || activeName.includes(recFirst)) {
          return true;
        }
      }

      return false;
    });
  };

  // Sync Local Storage Notifications & Real-Time Listener
  useEffect(() => {
    const syncLocalNotifications = () => {
      try {
        const saved = localStorage.getItem('crm_v2_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const userNotifs = filterNotificationsForUser(parsed);
            setNotifications(userNotifs);
            setUnreadNotificationCount(userNotifs.filter(n => !n.isRead && !n.read).length);
          }
        }
      } catch (e) {}
    };

    syncLocalNotifications();

    const handleCustomNotif = (e) => {
      syncLocalNotifications();
      if (e.detail) {
        setToastNotification(e.detail);
        setTimeout(() => setToastNotification(null), 5000);
      }
    };

    window.addEventListener('storage_notifications_updated', handleCustomNotif);
    window.addEventListener('storage', syncLocalNotifications);
    return () => {
      window.removeEventListener('storage_notifications_updated', handleCustomNotif);
      window.removeEventListener('storage', syncLocalNotifications);
    };
  }, [user]);

  // Firestore Real-Time Listener (onSnapshot)
  useEffect(() => {
    if (!user || !user.email) {
      setLoading(false);
      return;
    }

    let unsubNotifications = () => {};

    try {
      const notifRef = collection(db, 'notifications');
      
      unsubNotifications = onSnapshot(notifRef, (snapshot) => {
        const firestoreList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreList.push({ id: docSnap.id, ...data });
        });

        // Sort by date descending
        firestoreList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // Merge with local storage items
        const localSaved = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
        const combined = [...firestoreList, ...localSaved];

        // Deduplicate by ID
        const uniqueMap = new Map();
        combined.forEach(n => uniqueMap.set(n.id || n.title, n));
        const mergedList = Array.from(uniqueMap.values());

        const filtered = filterNotificationsForUser(mergedList);
        setNotifications(filtered);
        setUnreadNotificationCount(filtered.filter(n => !n.isRead && !n.read).length);
      }, (err) => {
        console.warn("Firestore notification snapshot subscription note:", err.message);
      });
    } catch (e) {
      console.warn("Real-time listener setup note:", e.message);
    } finally {
      setLoading(false);
    }

    return () => {
      if (typeof unsubNotifications === 'function') unsubNotifications();
    };
  }, [user]);

  // Send Notification Function (Local + Firestore dual dispatch)
  const sendNotification = async ({ recipientId, recipientName, recipientEmail, targetRoles, type, title, message, taskId, messageId }) => {
    const notifObj = {
      id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      recipientId: recipientId || '',
      recipientName: recipientName || '',
      recipientEmail: recipientEmail || '',
      targetRoles: targetRoles || [],
      senderId: user?.uid || 'SYSTEM',
      senderName: user?.name || 'System Administrator',
      type: type || 'TASK_ASSIGNED',
      title: title || 'New Notification 🔔',
      message: message || '',
      taskId: taskId || '',
      messageId: messageId || '',
      isRead: false,
      read: false,
      createdAt: new Date().toISOString()
    };

    // 1. Dispatch local event for instant real-time sync across tabs
    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = [notifObj, ...stored];
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('storage_notifications_updated', { detail: notifObj }));
    } catch (e) {}

    // 2. Insert into Firestore for cloud persistence
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notifObj,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore notification insert fallback to local storage:", err.message);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;

    // Local optimistic update
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true, read: true } : n));
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));

    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = stored.map(n => n.id === notificationId ? { ...n, isRead: true, read: true } : n);
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
    } catch (e) {}

    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true, read: true, readAt: serverTimestamp() });
    } catch (err) {}
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    setUnreadNotificationCount(0);

    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = stored.map(n => ({ ...n, isRead: true, read: true }));
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
    } catch (e) {}

    try {
      const unreadList = notifications.filter(n => !n.isRead && !n.read);
      await Promise.all(unreadList.map(n => {
        const notifRef = doc(db, 'notifications', n.id);
        return updateDoc(notifRef, { isRead: true, read: true, readAt: serverTimestamp() }).catch(() => {});
      }));
    } catch (err) {}
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadNotificationCount,
      messages,
      unreadMessageCount,
      toastNotification,
      sendNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      loading,
      error
    }}>
      {children}

      {/* Floating Real-Time Notification Toast Alert */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up flex items-start space-x-3">
          <div className="p-2 bg-blue-600 rounded-xl shrink-0 mt-0.5">
            <span className="text-base">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white">{toastNotification.title}</h4>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">{toastNotification.message}</p>
            <p className="text-[9px] text-blue-400 font-bold mt-1">Target: {toastNotification.recipientName || 'You'}</p>
          </div>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
