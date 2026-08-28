import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebaseClient';

// Ensure Firebase Auth uses in-memory persistence only (destroyed immediately when tab closes)
try {
  setPersistence(auth, inMemoryPersistence).catch(() => {});
  localStorage.removeItem('crm_v2_active_user');
} catch (e) {}

// Mark tab as closed when navigating away or closing window/tab
if (typeof window !== 'undefined') {
  const markTabClosed = () => {
    try {
      sessionStorage.setItem('crm_session_tab_closed', 'true');
      sessionStorage.setItem('crm_session_closed_at', Date.now().toString());
    } catch (e) {}
  };

  window.addEventListener('beforeunload', markTabClosed);
  window.addEventListener('pagehide', markTabClosed);
}

// Helper to verify if session should be kept (page reload) or discarded (tab was closed and reopened/restored via Ctrl+Shift+T)
const checkAndPurgeClosedTabSession = () => {
  try {
    localStorage.removeItem('crm_v2_active_user');

    const navEntries = typeof performance !== 'undefined' && performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
    const isPageReload = navEntries.length > 0
      ? navEntries[0].type === 'reload'
      : (typeof performance !== 'undefined' && performance.navigation && performance.navigation.type === 1);

    const tabWasClosed = sessionStorage.getItem('crm_session_tab_closed') === 'true';

    // If tab was previously closed AND this is NOT a standard F5 refresh (e.g. reopened via Ctrl+Shift+T, restored session, or opened anew)
    if (tabWasClosed && !isPageReload) {
      sessionStorage.removeItem('crm_v2_active_user');
      sessionStorage.removeItem('crm_session_tab_closed');
      sessionStorage.removeItem('crm_session_closed_at');
      firebaseSignOut(auth).catch(() => {});
      return null;
    }

    // If it was a normal F5 reload, clear the closed flag so user stays logged in smoothly
    if (isPageReload) {
      sessionStorage.removeItem('crm_session_tab_closed');
      sessionStorage.removeItem('crm_session_closed_at');
    }

    const saved = sessionStorage.getItem('crm_v2_active_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return null;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => checkAndPurgeClosedTabSession());
  const [loading, setLoading] = useState(false);

  // Fetch user profile directly from Firestore users collection
  const fetchFirestoreUserProfile = async (firebaseUser) => {
    if (!firebaseUser) return null;
    const uid = firebaseUser.uid;
    const email = (firebaseUser.email || '').toLowerCase().trim();

    try {
      // 1. Check by UID in Firestore
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const role = data.role || 'EMPLOYEE';
        return {
          uid,
          email: data.email || email,
          name: data.name || firebaseUser.displayName || email.split('@')[0] || 'User',
          role,
          roleDisplayName: role === 'SUPER_ADMIN' ? 'Super Admin' :
                           role === 'MANAGER' ? 'Manager' :
                           role === 'ADMIN' ? 'Admin' : 'Staff Advisor',
          branchId: data.branch || data.branchId || ''
        };
      }

      // 2. Check by email in Firestore if document ID is custom
      if (email) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const docData = qSnap.docs[0].data();
          const role = docData.role || 'EMPLOYEE';
          return {
            uid: qSnap.docs[0].id,
            email: docData.email || email,
            name: docData.name || firebaseUser.displayName || email.split('@')[0] || 'User',
            role,
            roleDisplayName: role === 'SUPER_ADMIN' ? 'Super Admin' :
                             role === 'MANAGER' ? 'Manager' :
                             role === 'ADMIN' ? 'Admin' : 'Staff Advisor',
            branchId: docData.branch || docData.branchId || ''
          };
        }
      }
    } catch (err) {
      console.warn("Firestore user profile fetch warning:", err.message);
    }

    return {
      uid,
      email,
      name: firebaseUser.displayName || (email ? email.split('@')[0] : 'User'),
      role: 'EMPLOYEE',
      roleDisplayName: 'Staff Advisor',
      branchId: ''
    };
  };

  useEffect(() => {
    // Check if session was marked closed upon tab reopen / Ctrl+Shift+T
    const activeSession = checkAndPurgeClosedTabSession();
    if (!activeSession) {
      setUser(null);
      firebaseSignOut(auth).catch(() => {});
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      const currentStoredUser = sessionStorage.getItem('crm_v2_active_user');
      const tabWasClosed = sessionStorage.getItem('crm_session_tab_closed') === 'true';

      const navEntries = typeof performance !== 'undefined' && performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
      const isPageReload = navEntries.length > 0
        ? navEntries[0].type === 'reload'
        : (typeof performance !== 'undefined' && performance.navigation && performance.navigation.type === 1);

      if (tabWasClosed && !isPageReload) {
        sessionStorage.removeItem('crm_v2_active_user');
        sessionStorage.removeItem('crm_session_tab_closed');
        sessionStorage.removeItem('crm_session_closed_at');
        firebaseSignOut(auth).catch(() => {});
        setUser(null);
        setLoading(false);
        return;
      }

      if (firebaseUser && currentStoredUser) {
        try {
          const profile = await fetchFirestoreUserProfile(firebaseUser);
          if (profile) {
            setUser(profile);
            sessionStorage.setItem('crm_v2_active_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn("Auth state change error:", err);
        }
      } else if (currentStoredUser) {
        try {
          setUser(JSON.parse(currentStoredUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Please enter your email and password.');
      }

      const formattedEmail = email.toLowerCase().trim();
      const inputPassword = password.trim();

      // Reset any previous closed tab flag
      sessionStorage.removeItem('crm_session_tab_closed');
      sessionStorage.removeItem('crm_session_closed_at');
      localStorage.removeItem('crm_v2_active_user');

      // Step 1: Query Firestore 'users' collection directly for the user account
      let matchedUser = null;
      let matchedDocId = null;

      try {
        const querySnap = await getDocs(collection(db, 'users'));
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.email && data.email.toLowerCase().trim() === formattedEmail) {
            matchedUser = data;
            matchedDocId = docSnap.id;
          }
        });
      } catch (firestoreErr) {
        console.warn("Firestore user lookup warning:", firestoreErr.message);
      }

      // Step 2: Validate against Firestore user account
      if (matchedUser) {
        // Check if user is deactivated
        if (matchedUser.status === 'DISABLED') {
          throw new Error('This user account is deactivated. Please contact your administrator.');
        }

        // Validate password from Firestore
        if (matchedUser.password && matchedUser.password !== inputPassword) {
          throw new Error('Invalid email address or password.');
        }

        const role = matchedUser.role || 'EMPLOYEE';
        const activeUser = {
          uid: matchedDocId || matchedUser.uid || `UID-STF-${Date.now()}`,
          email: matchedUser.email || formattedEmail,
          name: matchedUser.name || formattedEmail.split('@')[0],
          role: role,
          roleDisplayName: role === 'SUPER_ADMIN' ? 'Super Admin' :
                           role === 'MANAGER' ? 'Manager' :
                           role === 'ADMIN' ? 'Admin' : 'Staff Advisor',
          branchId: matchedUser.branch || matchedUser.branchId || ''
        };

        // Try authenticating with Firebase Auth in parallel with in-memory persistence
        try {
          await setPersistence(auth, inMemoryPersistence);
          await signInWithEmailAndPassword(auth, formattedEmail, inputPassword);
        } catch (e) {
          // Firestore account is the authoritative source of truth
        }

        setUser(activeUser);
        sessionStorage.setItem('crm_v2_active_user', JSON.stringify(activeUser));
        localStorage.removeItem('crm_v2_active_user');
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: activeUser }));
        return activeUser;
      }

      // Step 3: Attempt Firebase Authentication (Identity service) if not in Firestore users list
      try {
        await setPersistence(auth, inMemoryPersistence);
        const userCred = await signInWithEmailAndPassword(auth, formattedEmail, inputPassword);
        const activeUser = await fetchFirestoreUserProfile(userCred.user);
        setUser(activeUser);
        sessionStorage.setItem('crm_v2_active_user', JSON.stringify(activeUser));
        localStorage.removeItem('crm_v2_active_user');
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: activeUser }));
        return activeUser;
      } catch (firebaseErr) {
        if (
          firebaseErr.code === 'auth/invalid-credential' || 
          firebaseErr.code === 'auth/wrong-password' || 
          firebaseErr.code === 'auth/user-not-found'
        ) {
          throw new Error('Invalid email address or password.');
        } else if (firebaseErr.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        } else if (firebaseErr.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw new Error(firebaseErr.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } finally {
      sessionStorage.removeItem('crm_v2_active_user');
      sessionStorage.removeItem('crm_session_tab_closed');
      sessionStorage.removeItem('crm_session_closed_at');
      localStorage.removeItem('crm_v2_active_user');
      setUser(null);
      window.dispatchEvent(new CustomEvent('auth_user_logged_out'));
    }
  };

  const resetPassword = async (email) => {
    if (!email) throw new Error('Please enter an email address.');
    return sendPasswordResetEmail(auth, email.trim());
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
