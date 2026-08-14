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
  serverTimestamp,
  where
} from 'firebase/firestore';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-Time Firestore onSnapshot Listeners for Notifications & Messages
  useEffect(() => {
    if (!user || !user.email) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      setMessages([]);
      setUnreadMessageCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubNotifications = () => {};
    let unsubMessages = () => {};

    try {
      // 1. Notifications Listener (onSnapshot)
      const notifRef = collection(db, 'notifications');
      const qNotif = query(notifRef, orderBy('createdAt', 'desc'));

      unsubNotifications = onSnapshot(qNotif, (snapshot) => {
        const list = [];
        const activeName = (user.name || '').toLowerCase();
        const activeUid = user.uid || '';
        const activeRole = user.role || '';

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const item = { id: docSnap.id, ...data };

          // Check if notification matches recipient
          const isTargetedToUser = 
            item.recipientId === activeUid ||
            item.recipientEmail?.toLowerCase() === user.email?.toLowerCase() ||
            (item.recipientName && activeName && item.recipientName.toLowerCase().includes(activeName.split(' ')[0])) ||
            (item.targetRoles && item.targetRoles.includes(activeRole)) ||
            item.forAll === true;

          if (isTargetedToUser) {
            list.push(item);
          }
        });

        setNotifications(list);
        const unread = list.filter(n => !n.isRead && !n.read).length;
        setUnreadNotificationCount(unread);
        setError(null);
      }, (err) => {
        console.warn("Notifications onSnapshot subscription warning:", err.message);
        setError(err.message);
      });

      // 2. Team Chat Messages Listener (onSnapshot)
      const chatRef = collection(db, 'team_chats');
      const qChat = query(chatRef, orderBy('createdAt', 'asc'));

      unsubMessages = onSnapshot(qChat, (snapshot) => {
        const msgList = [];
        const activeName = (user.name || '').toLowerCase();
        const activeFirstName = activeName.split(' ')[0];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const item = { id: docSnap.id, ...data };
          msgList.push(item);
        });

        setMessages(msgList);

        // Count unread messages targeted to user or where user is tagged
        let unreadMsgs = 0;
        msgList.forEach(m => {
          if (m.senderName?.toLowerCase() !== activeName) {
            const isTagged = m.taggedStaff && m.taggedStaff.some(t => t.toLowerCase().includes(activeFirstName));
            const isDirectRecipient = m.receiverId === user.uid || m.receiverName?.toLowerCase() === activeName;
            if ((isTagged || isDirectRecipient) && !m.isRead) {
              unreadMsgs++;
            }
          }
        });

        setUnreadMessageCount(unreadMsgs);
      }, (err) => {
        console.warn("Messages onSnapshot subscription warning:", err.message);
      });

    } catch (e) {
      console.warn("Real-time listener setup exception:", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }

    return () => {
      if (typeof unsubNotifications === 'function') unsubNotifications();
      if (typeof unsubMessages === 'function') unsubMessages();
    };
  }, [user]);

  // Method to Send Task Assigned or General Notification
  const sendNotification = async ({ recipientId, recipientName, recipientEmail, targetRoles, type, title, message, taskId, messageId }) => {
    try {
      const notifDoc = {
        recipientId: recipientId || '',
        recipientName: recipientName || '',
        recipientEmail: recipientEmail || '',
        targetRoles: targetRoles || [],
        senderId: user?.uid || 'SYSTEM',
        senderName: user?.name || 'System Administrator',
        type: type || 'TASK_ASSIGNED',
        title: title || 'New Task Assigned',
        message: message || '',
        taskId: taskId || '',
        messageId: messageId || '',
        isRead: false,
        read: false,
        createdAt: serverTimestamp(),
        readAt: null
      };

      await addDoc(collection(db, 'notifications'), notifDoc);
    } catch (err) {
      console.warn("Failed to create notification doc:", err.message);
    }
  };

  // Method to Mark Notification as Read in Firestore
  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        isRead: true,
        read: true,
        readAt: serverTimestamp()
      });
    } catch (err) {
      // Local optimistic update fallback
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true, read: true } : n));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    }
  };

  // Method to Mark All Notifications as Read in Firestore
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.isRead && !n.read);
      await Promise.all(unreadList.map(n => {
        const notifRef = doc(db, 'notifications', n.id);
        return updateDoc(notifRef, { isRead: true, read: true, readAt: serverTimestamp() }).catch(() => {});
      }));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadNotificationCount(0);
    }
  };

  // Method to Send New Team Chat Message & Trigger Notification
  const sendMessage = async ({ text, taggedStaff = [], receiverId = '', receiverName = '' }) => {
    if (!text || !text.trim()) return;

    try {
      const msgDoc = {
        conversationId: 'TEAM_CHAT_MAIN',
        senderId: user?.uid || 'GUEST',
        senderName: user?.name || 'Staff Advisor',
        senderRole: user?.roleDisplayName || user?.role || 'Staff Advisor',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        receiverId: receiverId || '',
        receiverName: receiverName || '',
        text: text.trim(),
        content: text.trim(),
        taggedStaff: taggedStaff,
        isRead: false,
        createdAt: serverTimestamp(),
        readAt: null
      };

      const docRef = await addDoc(collection(db, 'team_chats'), msgDoc);

      // Create notification for tagged staff members or recipient
      if (taggedStaff.length > 0) {
        for (const staffName of taggedStaff) {
          await sendNotification({
            recipientName: staffName,
            type: 'NEW_MESSAGE',
            title: `New Tagged Message from ${user?.name || 'Teammate'}`,
            message: text.trim(),
            messageId: docRef.id
          });
        }
      } else if (receiverName) {
        await sendNotification({
          recipientName: receiverName,
          recipientId: receiverId,
          type: 'NEW_MESSAGE',
          title: `New Message from ${user?.name || 'Teammate'}`,
          message: text.trim(),
          messageId: docRef.id
        });
      }
    } catch (err) {
      console.warn("Failed to send message doc:", err.message);
    }
  };

  // Method to Mark Message as Read in Firestore
  const markMessageAsRead = async (messageId) => {
    if (!messageId) return;
    try {
      const msgRef = doc(db, 'team_chats', messageId);
      await updateDoc(msgRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Failed to mark message read:", err.message);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadNotificationCount,
      messages,
      unreadMessageCount,
      loading,
      error,
      sendNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      sendMessage,
      markMessageAsRead
    }}>
      {children}
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
