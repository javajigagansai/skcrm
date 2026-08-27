import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebaseClient';
import { 
  collection, 
  setDoc,
  updateDoc,
  deleteDoc,
  doc, 
  onSnapshot, 
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

  const getUserReadKey = () => {
    return 'crm_v2_read_notifs_' + (user?.uid || user?.email || 'default');
  };

  const getUserClearedKey = () => {
    return 'crm_v2_cleared_notifs_' + (user?.uid || user?.email || 'default');
  };

  const getPersistedReadIds = () => {
    try {
      const key = getUserReadKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set();
  };

  const getPersistedClearedIds = () => {
    try {
      const key = getUserClearedKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set();
  };

  const persistReadIds = (idsSet) => {
    try {
      const key = getUserReadKey();
      localStorage.setItem(key, JSON.stringify(Array.from(idsSet)));
    } catch (e) {}
  };

  const persistClearedIds = (idsSet) => {
    try {
      const key = getUserClearedKey();
      localStorage.setItem(key, JSON.stringify(Array.from(idsSet)));
    } catch (e) {}
  };

  // Helper to filter notifications targeted strictly to active user
  const filterNotificationsForUser = (notifList) => {
    if (!user) return [];
    const activeName = (user.name || '').toLowerCase().trim();
    const activeEmail = (user.email || '').toLowerCase().trim();
    const activeUid = user.uid || '';
    const activeRole = user.role || '';
    const readIds = getPersistedReadIds();
    const clearedIds = getPersistedClearedIds();

    return notifList.filter(item => {
      // 0. Filter out explicitly cleared notifications
      if (clearedIds.has(item.id) || (item.firestoreDocId && clearedIds.has(item.firestoreDocId))) {
        return false;
      }

      // 1. System-wide broadcast notifications
      if (item.forAll === true) return true;

      // 2. Match by Canonical Staff UID (primary key)
      if (item.recipientId && activeUid && item.recipientId === activeUid) return true;

      // 3. Match by Email
      if (item.recipientEmail && activeEmail && item.recipientEmail.toLowerCase() === activeEmail) return true;

      // 4. Match by Exact Recipient Name
      if (item.recipientName) {
        const recName = item.recipientName.toLowerCase().trim();
        if (recName && recName === activeName) {
          return true;
        }
      }

      // 5. Target Role match (only if no specific individual recipient was assigned)
      const hasSpecificRecipient = Boolean(item.recipientId || item.recipientEmail || item.recipientName);
      if (!hasSpecificRecipient && item.targetRoles && Array.isArray(item.targetRoles) && item.targetRoles.includes(activeRole)) {
        return true;
      }

      return false;
    }).map(item => {
      const isAlreadyRead = 
        item.isRead === true || 
        item.read === true || 
        readIds.has(item.id) || 
        (item.firestoreDocId && readIds.has(item.firestoreDocId)) ||
        (Array.isArray(item.readBy) && (item.readBy.includes(activeUid) || item.readBy.includes(activeEmail)));

      return {
        ...item,
        isRead: isAlreadyRead,
        read: isAlreadyRead
      };
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
        // ONLY show toast alert if notification is targeted strictly to the currently logged in user
        const isForMe = filterNotificationsForUser([e.detail]).length > 0;
        if (isForMe) {
          setToastNotification(e.detail);
          setTimeout(() => setToastNotification(null), 5000);
        }
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
          const docId = docSnap.id;
          firestoreList.push({ 
            ...data, 
            firestoreDocId: docId,
            id: data.id || docId 
          });
        });

        // Sort by date descending
        firestoreList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // Merge with local storage items
        const localSaved = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
        const combined = [...firestoreList, ...localSaved];

        // Deduplicate by ID
        const uniqueMap = new Map();
        combined.forEach(n => {
          const uniqueKey = n.id || n.firestoreDocId || n.title;
          if (!uniqueMap.has(uniqueKey) || n.firestoreDocId) {
            uniqueMap.set(uniqueKey, n);
          }
        });
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
    const notifId = 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const notifObj = {
      id: notifId,
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

    // 2. Insert into Firestore for cloud persistence using explicit notifId
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        ...notifObj,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore notification insert fallback to local storage:", err.message);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;

    // Find the target notification
    const target = notifications.find(n => n.id === notificationId || n.firestoreDocId === notificationId);
    const effectiveId = target?.id || notificationId;
    const firestoreId = target?.firestoreDocId || notificationId;

    // Persist read state in user-specific localStorage index
    const readIds = getPersistedReadIds();
    readIds.add(effectiveId);
    readIds.add(firestoreId);
    if (notificationId) readIds.add(notificationId);
    persistReadIds(readIds);

    // Local optimistic update in state
    setNotifications(prev => prev.map(n => 
      (n.id === notificationId || n.firestoreDocId === notificationId || n.id === effectiveId) 
        ? { ...n, isRead: true, read: true } 
        : n
    ));
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));

    // Update crm_v2_notifications in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = stored.map(n => 
        (n.id === notificationId || n.id === effectiveId) ? { ...n, isRead: true, read: true } : n
      );
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
    } catch (e) {}

    // Update Firestore
    try {
      await setDoc(doc(db, 'notifications', firestoreId), { 
        isRead: true, 
        read: true, 
        readAt: serverTimestamp() 
      }, { merge: true });

      if (effectiveId !== firestoreId) {
        await setDoc(doc(db, 'notifications', effectiveId), { 
          isRead: true, 
          read: true, 
          readAt: serverTimestamp() 
        }, { merge: true });
      }
    } catch (err) {}
  };

  const markAllNotificationsAsRead = async () => {
    const readIds = getPersistedReadIds();
    notifications.forEach(n => {
      if (n.id) readIds.add(n.id);
      if (n.firestoreDocId) readIds.add(n.firestoreDocId);
    });
    persistReadIds(readIds);

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    setUnreadNotificationCount(0);

    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = stored.map(n => ({ ...n, isRead: true, read: true }));
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
    } catch (e) {}

    try {
      await Promise.all(notifications.map(n => {
        const docId = n.firestoreDocId || n.id;
        return setDoc(doc(db, 'notifications', docId), { 
          isRead: true, 
          read: true, 
          readAt: serverTimestamp() 
        }, { merge: true }).catch(() => {});
      }));
    } catch (err) {}
  };

  const clearAllNotifications = async () => {
    const clearedIds = getPersistedClearedIds();
    const readIds = getPersistedReadIds();
    notifications.forEach(n => {
      if (n.id) {
        clearedIds.add(n.id);
        readIds.add(n.id);
      }
      if (n.firestoreDocId) {
        clearedIds.add(n.firestoreDocId);
        readIds.add(n.firestoreDocId);
      }
    });
    persistClearedIds(clearedIds);
    persistReadIds(readIds);

    const oldNotifs = [...notifications];
    setNotifications([]);
    setUnreadNotificationCount(0);

    // Clean from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('crm_v2_notifications') || '[]');
      const updated = stored.filter(n => !clearedIds.has(n.id) && !clearedIds.has(n.firestoreDocId));
      localStorage.setItem('crm_v2_notifications', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('storage_notifications_updated'));
    } catch (e) {}

    // Clean up from Firestore
    try {
      await Promise.all(oldNotifs.map(n => {
        const docId = n.firestoreDocId || n.id;
        return deleteDoc(doc(db, 'notifications', docId)).catch(() => {});
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
      clearAllNotifications,
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
